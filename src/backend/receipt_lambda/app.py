# app.py  (handler = app.handler)
import os, json, time, re
import boto3
from urllib.parse import unquote_plus
from decimal import Decimal

from claude_wrapper import ClaudeWrapper  # your wrapper

TABLE_NAME  = os.environ["RECEIPTS_TABLE"]
MAX_TOKENS  = int(os.environ.get("ANTHROPIC_MAX_TOKENS", "1000"))

s3  = boto3.client("s3")
ddb = boto3.resource("dynamodb").Table(TABLE_NAME)

DATA_URL_RE = re.compile(r"^data:(?P<mime>[^;]+);base64,(?P<b64>.+)$", re.I)

def decimalize(x):
    if isinstance(x, float): return Decimal(str(x))
    if isinstance(x, dict):  return {k: decimalize(v) for k, v in x.items()}
    if isinstance(x, list):  return [decimalize(v) for v in x]
    return x

def extract_b64(text: str) -> str:
    m = DATA_URL_RE.match(text.strip())
    return m.group("b64") if m else text.strip()

def handler(event, context):
    claude = ClaudeWrapper()  # uses ANTHROPIC_API_KEY_1

    for rec in event.get("Records", []):
        bucket = rec["s3"]["bucket"]["name"]
        key    = unquote_plus(rec["s3"]["object"]["key"])

        # read base64 string from S3 (no decoding)
        body_text = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")
        b64_str   = extract_b64(body_text)

        # call Claude (expects JSON string or "None")
        result_str = claude.read_receipt(base64_input=b64_str, max_tokens=MAX_TOKENS)

        # derive keys (fallbacks if not in JSON)
        parts = key.split("/")
        derived_user = parts[2] if len(parts) >= 3 else "unknown"
        today = time.strftime("%Y-%m-%d", time.gmtime())

        if not result_str or result_str.strip().lower() == "none":
            # minimal "not a receipt" row
            ddb.put_item(Item={
                "userId": derived_user,
                "date": today,
                "status": "unrecognized",
                "s3Key": key,
                "parsedAt": int(time.time())
            })
            continue

        # parse JSON (if it fails, just store raw)
        try:
            parsed = json.loads(result_str)
        except json.JSONDecodeError:
            ddb.put_item(Item={
                "userId": derived_user,
                "date": today,
                "status": "parsed_raw",
                "s3Key": key,
                "claudeRaw": result_str,
                "parsedAt": int(time.time())
            })
            continue

        user_id = str(parsed.get("userId") or derived_user)
        date_iso = str(parsed.get("date") or today)

        item = {
            "userId":   user_id,                 # PK
            "date":     date_iso,                # SK
            "status":   "parsed",
            "vendor":   parsed.get("vendor"),
            "items":    parsed.get("items", []),
            "subtotal": parsed.get("subtotal"),
            "taxes":    parsed.get("taxes"),
            "fees":     parsed.get("fees"),
            "total":    parsed.get("total"),
            "s3Key":    key,
            "parsedAt": int(time.time())
        }

        # drop None and write
        item = {k: v for k, v in item.items() if v is not None}
        ddb.put_item(Item=decimalize(item))

    return {"ok": True}
