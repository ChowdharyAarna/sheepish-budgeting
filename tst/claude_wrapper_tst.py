from src.backend.receipt_lambda.claude_wrapper import ClaudeWrapper
from dotenv import load_dotenv
 

import base64 
import json


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

if __name__ == "__main__":
    # Initialize wrapper
    load_dotenv()
    claude = ClaudeWrapper()  # Uses ANTHROPIC_API_KEY env var

    response_1 = claude.read_receipt("tst/receipt_photos/picture_1.jpeg")

    response_2 = claude.read_receipt("tst/receipt_photos/picture_2.jpeg")

    response_3 = claude.read_receipt("tst/receipt_photos/picture_3.jpeg")

    response_4 = claude.read_receipt("tst/receipt_photos/picture_4.jpeg")

    response_5 = claude.read_receipt("tst/receipt_photos/picture_5.jpeg")

    print(f'response_1: {response_1}\n')
    print(f'response_2: {response_2}\n')
    print(f'response_3: {response_3}\n')
    print(f'response_4: {response_4}\n')
    print(f'response_5: {response_5}\n')

    if response_1:
        with open("tst/claude_tst_outputs/picture_1_output.json", "w") as file:
            json.dump(response_1, file, indent=4)

    if response_2:
        with open("tst/claude_tst_outputs/picture_2_output.json", "w") as file:
            json.dump(response_2, file, indent=4)

    if response_3:
        with open("tst/claude_tst_outputs/picture_3_output.json", "w") as file:
            json.dump(response_3, file, indent=4)

    if response_4:
        with open("tst/claude_tst_outputs/picture_4_output.json", "w") as file:
            json.dump(response_4, file, indent=4)

    if response_5:
        with open("tst/claude_tst_outputs/picture_5_output.json", "w") as file:
            json.dump(response_5, file, indent=4)