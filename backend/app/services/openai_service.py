"""
OpenAI Service for lyxbot platform.

This module provides functionality for interacting with OpenAI's API
to generate content and perform chat completions.
"""
import os
from typing import List
from dataclasses import dataclass
from openai import OpenAI


# Initialize OpenAI client with API key from environment
# The client will be initialized lazily when needed
_openai_client = None


def _get_client():
    """
    Get or initialize the OpenAI client.
    
    Returns:
        OpenAI: Initialized OpenAI client.
        
    Raises:
        ValueError: If OPENAI_API_KEY is not set.
    """
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment."
            )
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


@dataclass
class ChatMessage:
    """
    Represents a chat message in the conversation.
    
    Attributes:
        role: The role of the message sender. Accepted values: 'system', 'user', 'assistant'.
        content: The content of the message.
    """
    role: str
    content: str

    def to_dict(self):
        """
        Convert the ChatMessage to a dictionary format for the OpenAI API.
        
        Returns:
            dict: Dictionary with 'role' and 'content' keys.
        """
        return {"role": self.role, "content": self.content}


def chat_completion(messages: List[ChatMessage], model: str = "gpt-3.5-turbo", temperature: float = 0.7):
    """
    Generate a chat completion using OpenAI's API.
    
    Args:
        messages: List of ChatMessage objects representing the conversation history.
        model: The OpenAI model to use for completion (default: "gpt-3.5-turbo").
        temperature: Controls randomness in the output (0.0 to 2.0, default: 0.7).
        
    Returns:
        The response from OpenAI's chat completion API.
        
    Raises:
        ValueError: If the API key is not set.
        Exception: If the API call fails.
    """
    # Convert ChatMessage objects to dictionaries
    message_dicts = [msg.to_dict() for msg in messages]
    
    # Get the OpenAI client
    client = _get_client()
    
    # Make the API call
    response = client.chat.completions.create(
        model=model,
        messages=message_dicts,
        temperature=temperature
    )
    
    return response
