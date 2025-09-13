import anthropic
import os
import base64
from typing import List, Dict, Optional, AsyncGenerator, Union
import asyncio

class ClaudeWrapper:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude wrapper
        
        Args:
            api_key: Your Anthropic API key. If None, will look for ANTHROPIC_API_KEY env var
        """
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY_1')
        if not self.api_key:
            raise ValueError("API key required. Set ANTHROPIC_API_KEY env var or pass api_key parameter")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.async_client = anthropic.AsyncAnthropic(api_key=self.api_key)
        
        # Claude Sonnet 4 model string
        self.model = "claude-sonnet-4-20250514"
    
    def chat(self, 
             message: str, 
             max_tokens: int = 4096,
             temperature: float = 0.7,
             system: Optional[str] = None) -> str:
        """
        Send a single message to Claude
        
        Args:
            message: User message
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0-1)
            system: System prompt to set behavior
        
        Returns:
            Claude's response as string
        """
        messages = [{"role": "user", "content": message}]
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages
        )
        
        return response.content[0].text

    def chat_with_history(self,
                         messages: List[Dict[str, str]],
                         max_tokens: int = 4096,
                         temperature: float = 0.7,
                         system: Optional[str] = None) -> str:
        """
        Chat with conversation history
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0-1)
            system: System prompt
            
        Returns:
            Claude's response as string
        """
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages
        )
        
        return response.content[0].text
    
    def stream_chat(self,
                   message: str,
                   max_tokens: int = 4096,
                   temperature: float = 0.7,
                   system: Optional[str] = None):
        """
        Stream Claude's response in real-time
        
        Args:
            message: User message
            max_tokens: Maximum tokens in response
            temperature: Response creativity (0-1)
            system: System prompt
            
        Yields:
            Chunks of Claude's response
        """
        messages = [{"role": "user", "content": message}]
        
        with self.client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages
        ) as stream:
            for text in stream.text_stream:
                yield text

    def _encode_image(self, image_path: str) -> tuple[str, str]:
        """
        Encode an image file to base64
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Tuple of (media_type, base64_data)
        """
        # Determine media type based on file extension
        extension = image_path.lower().split('.')[-1]
        media_type_map = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        
        media_type = media_type_map.get(extension, 'image/jpeg')
        
        with open(image_path, 'rb') as image_file:
            base64_data = base64.b64encode(image_file.read()).decode('utf-8')
        
        return media_type, base64_data

    def read_receipt(self, base64_input: str, categories: list = [], max_tokens: int = 4096) -> str:
        """
        Process a receipt image (as base64 string) and extract itemized information.
        
        Args:
            base64_input: A base64-encoded image string (e.g., from mobile app or API).
            max_tokens: Maximum tokens in response.
            
        Returns:
            JSON string with receipt data (with categories added) or 'None' if not a receipt.
        """

        # Assume base64 input is always JPEG unless otherwise specified
        media_type = "image/jpeg"
        
        system_prompt = f'''
        Given this receipt, follow the rules below to generate a json string (do NOT include json in the beginning of the string)
        
        Follow these rules:
        1. Get the item and its cost, subtotal, taxes, other fees, and total
        2. If the name of the item is unclear/not a well known item, look up what it is and use that name.
        3. Do NOT give a description of the item or the payment method.
        4. Include the vendor name.
        5. Include the date of the transaction, if not visible use today's date

        Also Follow these Category rules:
        - Add categories to each item
        - The available categories are {categories}, Do not invent new categories.
        - If there it does not match one of the categories, put it in "Other"

        If the image is not a receipt, simply return the string "None" and NOTHING ELSE
        ''' + '''\
        The outputted json string should follow a format like this:
        {
        "date": "2025-09-13",
        "items": [
            {"name": "Coffee", "cost": 3.50, "category": "Food"},
            {"name": "Notebook", "cost": 5.00, "category": "Stationary"}
        ],
         "subtotal": 8.50,
         "taxes": 0.50,
         "fees" : 0.00,
         "total": 9.00
        }
        '''
        # Create message with image
        messages = [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_input
                    }
                },
                {
                    "type": "text",
                    "text": system_prompt
                }
            ]
        }]
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=messages
        )
        
        return response.content[0].text
    
    async def async_stream_chat(self,
                               message: str,
                               max_tokens: int = 4096,
                               temperature: float = 0.7,
                               system: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        Async streaming chat
        """
        messages = [{"role": "user", "content": message}]
        
        async with self.async_client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def async_read_receipt(self, image_input: Union[str, bytes], max_tokens: int = 4096) -> str:
        """
        Async version of read_receipt
        """
        # Handle different input types
        if isinstance(image_input, str):
            # Assume it's a file path
            media_type, base64_data = self._encode_image(image_input)
        elif isinstance(image_input, bytes):
            # Assume it's JPEG bytes (most common for mobile apps)
            media_type = 'image/jpeg'
            base64_data = base64.b64encode(image_input).decode('utf-8')
        else:
            raise ValueError("image_input must be either a file path (str) or image bytes")
        
        # Create message with image
        messages = [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64_data
                    }
                },
                {
                    "type": "text",
                    "text": """Given this receipt, give a list of each item and cost, subtotal, taxes, other fees, and total.
                    If the name of the item is unclear/not a well known item, look up what it is and use that name.
                    Give this information in a json string.
                    If the image is not a receipt, simply return the string 'None'."""
                }
            ]
        }]
        
        response = await self.async_client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=messages
        )
        
        return response.content[0].text


class ConversationManager:
    """Helper class to manage conversation history"""
    
    def __init__(self, claude_wrapper: ClaudeWrapper, system_prompt: Optional[str] = None):
        self.claude = claude_wrapper
        self.system_prompt = system_prompt
        self.messages: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        """Add a message to conversation history"""
        self.messages.append({"role": role, "content": content})
    
    def send_message(self, message: str, **kwargs) -> str:
        """Send message and update conversation history"""
        # Add user message
        self.add_message("user", message)
        
        # Get response
        response = self.claude.chat_with_history(
            messages=self.messages,
            system=self.system_prompt,
            **kwargs
        )
        
        # Add Claude's response to history
        self.add_message("assistant", response)
        
        return response
    
    def clear_history(self):
        """Clear conversation history"""
        self.messages = []
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.messages.copy()


# Usage examples
if __name__ == "__main__":
    # Initialize wrapper
    claude = ClaudeWrapper()  # Uses ANTHROPIC_API_KEY env var
    
    # Simple chat
    response = claude.chat("Hello! What can you help me with?")
    print(f"Claude: {response}")
    
    # Process a receipt image
    try:
        receipt_data = claude.read_receipt("path/to/receipt.jpg")
        print(f"Receipt data: {receipt_data}")
    except FileNotFoundError:
        print("Receipt image file not found")
    
    # Example with image bytes (useful for mobile apps)
    # with open("receipt.jpg", "rb") as f:
    #     image_bytes = f.read()
    # receipt_data = claude.read_receipt(image_bytes)
    # print(f"Receipt data: {receipt_data}")
    
    # Chat with system prompt
    response = claude.chat(
        "Write a haiku about programming",
        system="You are a poetic programming mentor"
    )
    print(f"Claude: {response}")
    
    # Streaming response
    print("Streaming response:")
    for chunk in claude.stream_chat("Tell me a short story"):
        print(chunk, end="", flush=True)
    print()
    
    # Conversation with history
    conversation = ConversationManager(claude, "You are a helpful coding assistant")
    
    response1 = conversation.send_message("How do I reverse a string in Python?")
    print(f"Claude: {response1}")
    
    response2 = conversation.send_message("Can you show me a more advanced example?")
    print(f"Claude: {response2}")
    
    # Async example
    async def async_example():
        response = await claude.async_chat("What's the weather like on Mars?")
        print(f"Async Claude: {response}")
        
        # Async receipt processing
        try:
            receipt_data = await claude.async_read_receipt("path/to/receipt.jpg")
            print(f"Async Receipt data: {receipt_data}")
        except FileNotFoundError:
            print("Receipt image file not found")
        
        print("Async streaming:")
        async for chunk in claude.async_stream_chat("Tell me about quantum computing"):
            print(chunk, end="", flush=True)
        print()
    
    # Run async example
    asyncio.run(async_example())