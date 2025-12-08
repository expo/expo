"""
Service layer for OpenAI API interactions
"""
from openai import OpenAI
from typing import List, Optional, Tuple
from models import ChatMessage
from config import settings


class LyxBotService:
    """Service class for handling AI chat operations"""
    
    def __init__(self):
        """Initialize the OpenAI client"""
        self.client = None
        if settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)
    
    def is_configured(self) -> bool:
        """Check if OpenAI API is properly configured"""
        return self.client is not None and bool(settings.openai_api_key)
    
    async def chat_completion(
        self,
        message: str,
        conversation_history: Optional[List[ChatMessage]] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Tuple[str, int]:
        """
        Send a chat message and get AI response
        
        Args:
            message: User's message
            conversation_history: Optional list of previous messages
            model: Model to use (defaults to configured model)
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Tuple of (response_message, tokens_used)
            
        Raises:
            ValueError: If OpenAI API is not configured
            Exception: If API call fails
        """
        if not self.is_configured():
            raise ValueError("OpenAI API key is not configured. Please set OPENAI_API_KEY in .env file")
        
        # Use provided values or fall back to settings defaults
        model = model or settings.default_model
        temperature = temperature if temperature is not None else settings.temperature
        max_tokens = max_tokens or settings.max_tokens
        
        # Build messages array
        messages = []
        
        # Add system message
        messages.append({
            "role": "system",
            "content": "You are LyxBot, a helpful AI assistant. Provide clear, concise, and friendly responses."
        })
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": message
        })
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response
            assistant_message = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0
            
            return assistant_message, tokens_used
            
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def get_available_models(self) -> List[dict]:
        """
        Get list of available models
        
        Returns:
            List of model information dictionaries
        """
        # For now, return static list of commonly used models
        # In production, you might want to fetch this from OpenAI API
        return [
            {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "description": "Fast and efficient model for general tasks",
                "max_tokens": 4096
            },
            {
                "id": "gpt-4",
                "name": "GPT-4",
                "description": "Most capable model for complex tasks",
                "max_tokens": 8192
            },
            {
                "id": "gpt-4-turbo-preview",
                "name": "GPT-4 Turbo",
                "description": "Enhanced GPT-4 with improved performance",
                "max_tokens": 128000
            }
        ]


# Create singleton instance
lyxbot_service = LyxBotService()
