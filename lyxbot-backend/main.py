"""
LyxBot AI Platform - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from config import settings
from routers import router
from models import ErrorResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting LyxBot API Server")
    logger.info(f"📍 Server will run on {settings.host}:{settings.port}")
    logger.info(f"🤖 Default model: {settings.default_model}")
    
    # Check OpenAI configuration
    if not settings.openai_api_key:
        logger.warning("⚠️  OpenAI API key not configured. Set OPENAI_API_KEY in .env file")
    else:
        logger.info("✅ OpenAI API key configured")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down LyxBot API Server")


# Create FastAPI application
app = FastAPI(
    title="LyxBot AI Platform API",
    description="""
    ## LyxBot AI Platform
    
    A modular AI platform built with FastAPI and OpenAI's GPT models.
    
    ### Features
    
    * 🤖 **Chat Completion**: Interact with AI using natural language
    * 📚 **Multiple Models**: Support for GPT-3.5, GPT-4, and more
    * 💬 **Context-Aware**: Maintain conversation history for better responses
    * 🔧 **Configurable**: Adjust temperature, tokens, and model selection
    * 🚀 **Fast**: Built on FastAPI for high performance
    * 📖 **Well Documented**: Complete API documentation with examples
    
    ### Getting Started
    
    1. Configure your OpenAI API key in `.env` file
    2. Send a POST request to `/api/chat` with your message
    3. Receive an AI-generated response
    
    ### Authentication
    
    Currently, the API uses server-side OpenAI authentication.
    All requests use the configured API key from the server environment.
    
    ### Rate Limits
    
    Rate limits are determined by your OpenAI API plan.
    Monitor your usage in the OpenAI dashboard.
    """,
    version="1.0.0",
    contact={
        "name": "LyxBot Team",
        "url": "https://github.com/Coatvision/expo",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with detailed error messages
    """
    logger.error(f"Validation error: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Invalid request parameters",
            "detail": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle general exceptions
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.reload else None  # Only show details in debug mode
        }
    )


# Include API routes
app.include_router(router, prefix="/api", tags=["API"])


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all incoming requests
    """
    logger.info(f"📨 {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 {request.method} {request.url.path} - Status: {response.status_code}")
    return response


if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level="info"
    )
