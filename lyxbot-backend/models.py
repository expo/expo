"""
Data models for LyxBot API requests and responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    """A single message in a chat conversation"""
    role: str = Field(..., description="Role of the message sender (user, assistant, or system)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    """Request model for chat completion"""
    message: str = Field(..., description="User's message to send to the AI", min_length=1, max_length=4000)
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Optional conversation history for context"
    )
    model: Optional[str] = Field(default=None, description="Model to use (defaults to gpt-3.5-turbo)")
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0, description="Sampling temperature (0-2)")
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4000, description="Maximum tokens in response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello, how can you help me?",
                "model": "gpt-3.5-turbo",
                "temperature": 0.7,
                "max_tokens": 150
            }
        }


class ChatResponse(BaseModel):
    """Response model for chat completion"""
    message: str = Field(..., description="AI's response message")
    model: str = Field(..., description="Model used for generation")
    timestamp: str = Field(..., description="ISO timestamp of the response")
    tokens_used: Optional[int] = Field(None, description="Number of tokens used in the completion")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello! I'm LyxBot, an AI assistant. I can help you with various tasks...",
                "model": "gpt-3.5-turbo",
                "timestamp": "2024-12-08T09:30:00Z",
                "tokens_used": 50
            }
        }


class ModelInfo(BaseModel):
    """Information about an available AI model"""
    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Human-readable model name")
    description: str = Field(..., description="Model description")
    max_tokens: int = Field(..., description="Maximum tokens supported")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "gpt-3.5-turbo",
                "name": "GPT-3.5 Turbo",
                "description": "Fast and efficient model for general tasks",
                "max_tokens": 4096
            }
        }


class ModelsResponse(BaseModel):
    """Response model for available models list"""
    models: List[ModelInfo] = Field(..., description="List of available AI models")
    default_model: str = Field(..., description="Default model identifier")
    
    class Config:
        json_schema_extra = {
            "example": {
                "models": [
                    {
                        "id": "gpt-3.5-turbo",
                        "name": "GPT-3.5 Turbo",
                        "description": "Fast and efficient model for general tasks",
                        "max_tokens": 4096
                    }
                ],
                "default_model": "gpt-3.5-turbo"
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    timestamp: str = Field(..., description="ISO timestamp")
    openai_configured: bool = Field(..., description="Whether OpenAI API key is configured")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-12-08T09:30:00Z",
                "openai_configured": True
            }
        }


class ErrorResponse(BaseModel):
    """Response model for errors"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid request parameters",
                "detail": {"field": "message", "issue": "Field required"}
            }
        }
