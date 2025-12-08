"""
API routes for LyxBot
"""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone
from typing import Dict

from models import (
    ChatRequest, ChatResponse,
    ModelsResponse, ModelInfo,
    HealthResponse, ErrorResponse
)
from service import lyxbot_service
from config import settings

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Successful chat completion",
            "model": ChatResponse,
        },
        400: {
            "description": "Bad request - Invalid input",
            "model": ErrorResponse,
        },
        500: {
            "description": "Internal server error - OpenAI API error",
            "model": ErrorResponse,
        }
    },
    summary="Send a chat message",
    description="Send a message to LyxBot and receive an AI-generated response. "
                "Optionally provide conversation history for context-aware responses.",
    tags=["Chat"]
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a chat message to LyxBot AI and receive a response.
    
    This endpoint uses OpenAI's GPT models to generate intelligent responses
    based on the user's message and optional conversation history.
    
    **Request Body:**
    - `message` (required): The user's message
    - `conversation_history` (optional): Previous messages for context
    - `model` (optional): Specific model to use
    - `temperature` (optional): Creativity/randomness (0-2)
    - `max_tokens` (optional): Maximum response length
    
    **Response:**
    Returns the AI's response message along with metadata.
    """
    try:
        # Call the service to get AI response
        response_message, tokens_used = await lyxbot_service.chat_completion(
            message=request.message,
            conversation_history=request.conversation_history,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Create response
        return ChatResponse(
            message=response_message,
            model=request.model or settings.default_model,
            timestamp=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            tokens_used=tokens_used
        )
        
    except ValueError as e:
        # Configuration error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "ConfigurationError",
                "message": str(e)
            }
        )
    except Exception as e:
        # API or other errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": f"Failed to process chat request: {str(e)}"
            }
        )


@router.get(
    "/models",
    response_model=ModelsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "List of available AI models",
            "model": ModelsResponse,
        }
    },
    summary="Get available models",
    description="Retrieve a list of AI models available for chat completion.",
    tags=["Models"]
)
async def get_models() -> ModelsResponse:
    """
    Get list of available AI models.
    
    Returns information about all AI models that can be used with the chat endpoint,
    including their capabilities and token limits.
    
    **Response:**
    Returns a list of available models and the default model identifier.
    """
    models_data = lyxbot_service.get_available_models()
    
    return ModelsResponse(
        models=[ModelInfo(**model) for model in models_data],
        default_model=settings.default_model
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "description": "Service health status",
            "model": HealthResponse,
        }
    },
    summary="Health check",
    description="Check the health and configuration status of the LyxBot API service.",
    tags=["System"]
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    
    Provides information about the API service status and configuration.
    Use this to verify that the service is running and properly configured.
    
    **Response:**
    Returns service health status, version, and configuration status.
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        openai_configured=lyxbot_service.is_configured()
    )


@router.get(
    "/",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
    summary="API information",
    description="Get basic information about the LyxBot API.",
    tags=["System"]
)
async def root() -> Dict[str, str]:
    """
    Root endpoint providing API information.
    
    **Response:**
    Returns welcome message and API documentation links.
    """
    return {
        "message": "Welcome to LyxBot API",
        "version": "1.0.0",
        "documentation": "/docs",
        "openapi": "/openapi.json"
    }
