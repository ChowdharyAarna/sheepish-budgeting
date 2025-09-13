import boto3
import json, urllib.parse
from claude_wrapper import ClaudeWrapper

s3 = boto3.client("s3")

RESULTS_PREFIX = "receipts-json/"

def _get_type(ctype, key):
    if ctype:
        return ctype
    k = key.lower()
    if k.endswith(".png"):   return "image/png"
    if k.endswith(".jpg") or k.endswith(".jpeg"): return "image/jpeg"
    if k.endswith(".webp"):  return "image/webp"
    if k.endswith(".heic") or k.endswith(".heif"): return "image/heic"
    if k.endswith(".pdf"):   return "application/pdf"
    return "application/octet-stream"

def _get_bytes(bucket_name, key):
    resp = s3.get_object(Bucket=bucket_name, Key=key)
    return resp["Body"].read(), resp.get("ContentType")

def _out_key(src_key):
    return f"{RESULTS_PREFIX}{src_key}.json"

def _put_json(bucket, key, doc):
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        ContentType="application/json",
    )

def _extract(image_bytes):
    cw = ClaudeWrapper()  # uses ANTHROPIC_API_KEY from env
    result_str = cw.read_receipt(image_input=image_bytes)

    if isinstance(result_str, str) and result_str.strip().lower() == "none":
        return {"recognized": False, "reason": "not_a_receipt"}

    try:
        parsed = json.loads(result_str)
        if isinstance(parsed, dict):
            parsed.setdefault("recognized", True)
        return parsed if isinstance(parsed, dict) else {"recognized": True, "data": parsed}
    except Exception:
        return {"recognized": True, "raw_text": result_str}

def lambda_handler(event, _):
    results = []
    for record in event.get("Records", []):
        bucket_name = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        data, ctype = _get_bytes(bucket_name, key)
        mime = _get_type(ctype, key)  # kept for metadata/debugging

        extracted = _extract(data)
        out_key = _out_key(key)

        _put_json(bucket_name, out_key, {
            "source_bucket": bucket_name,
            "source_key": key,
            "mime": mime,
            "extracted": extracted,
        })

        results.append({
            "bucket": bucket_name,
            "key": key,
            "output_bucket": bucket_name,
            "output_key": out_key,
            "status": "ok"
        })
    return {"results": results}
