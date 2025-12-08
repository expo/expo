"""
OpenAI Service for lyxbot platform.

This module provides functionality for interacting with OpenAI's API
to generate content and perform chat completions.
"""
import os
from typing import List
from dataclasses import dataclass
from enum import Enum
from openai import OpenAI, OpenAIError


class MessageRole(Enum):
    """Enum for valid message roles in chat completions."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


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

    def __post_init__(self):
        """Validate the role after initialization."""
        valid_roles = {role.value for role in MessageRole}
        if self.role not in valid_roles:
            raise ValueError(
                f"Invalid role '{self.role}'. Must be one of: {', '.join(valid_roles)}"
            )

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
        ValueError: If the API key is not set, messages is empty, or parameters are invalid.
        OpenAIError: If the API call fails.
    """
    # Validate input parameters
    if not messages:
        raise ValueError("messages list cannot be empty")
    
    if not all(isinstance(msg, ChatMessage) for msg in messages):
        raise ValueError("All messages must be ChatMessage objects")
    
    if not 0.0 <= temperature <= 2.0:
        raise ValueError(f"temperature must be between 0.0 and 2.0, got {temperature}")
    
    # Convert ChatMessage objects to dictionaries
    message_dicts = [msg.to_dict() for msg in messages]
    
    # Get the OpenAI client
    client = _get_client()
    
    # Make the API call with error handling
    try:
        response = client.chat.completions.create(
            model=model,
            messages=message_dicts,
            temperature=temperature
        )
        return response
    except OpenAIError as e:
        # Re-raise OpenAI-specific errors with context
        raise OpenAIError(f"OpenAI API call failed: {str(e)}") from e
    except Exception as e:
        # Catch any other unexpected errors
        raise Exception(f"Unexpected error during chat completion: {str(e)}") from e
