# LyxBot AI Platform - Backend API

A modern FastAPI-based backend for the LyxBot AI platform, providing seamless integration with OpenAI's GPT models for the Expo/React Native frontend.

> **Security Note:** This implementation uses FastAPI 0.109.1, which includes a security patch for CVE-2024-24762 (Content-Type Header ReDoS vulnerability).

## 🌟 Features

- **FastAPI Framework**: High-performance, modern Python web framework
- **OpenAI Integration**: Direct integration with GPT-3.5, GPT-4, and other models
- **RESTful API**: Clean, well-documented REST endpoints
- **Swagger Documentation**: Interactive API documentation at `/docs`
- **CORS Support**: Pre-configured for Expo and React Native applications
- **Type Safety**: Full Pydantic model validation
- **Error Handling**: Comprehensive error handling with detailed messages
- **Health Monitoring**: Built-in health check endpoint
- **Environment Configuration**: Easy configuration via `.env` files

## 📋 Prerequisites

- Python 3.9 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- pip (Python package manager)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd lyxbot-backend
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
cd lyxbot-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start at `http://localhost:8000`

### 4. Access Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 📚 API Endpoints

### Chat Endpoint

**POST** `/api/chat`

Send a message to LyxBot and receive an AI-generated response.

**Request Body:**
```json
{
  "message": "Hello, how can you help me?",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 150
}
```

**Response:**
```json
{
  "message": "Hello! I'm LyxBot, an AI assistant. I can help you with...",
  "model": "gpt-3.5-turbo",
  "timestamp": "2024-12-08T09:30:00Z",
  "tokens_used": 50
}
```

### Models Endpoint

**GET** `/api/models`

Get list of available AI models.

**Response:**
```json
{
  "models": [
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
    }
  ],
  "default_model": "gpt-3.5-turbo"
}
```

### Health Check

**GET** `/api/health`

Check service health and configuration status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-12-08T09:30:00Z",
  "openai_configured": true
}
```

## 🔧 Configuration

All configuration is done via environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `HOST` | Server host address | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `RELOAD` | Auto-reload on code changes | `true` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,...` |
| `DEFAULT_MODEL` | Default OpenAI model | `gpt-3.5-turbo` |
| `MAX_TOKENS` | Default max tokens | `150` |
| `TEMPERATURE` | Default temperature | `0.7` |

## 🌐 CORS Configuration

The API is pre-configured to accept requests from common development origins:
- `http://localhost:3000` (React web apps)
- `http://localhost:19006` (Expo web)
- `exp://localhost:19000` (Expo mobile)

To add more origins, update the `CORS_ORIGINS` variable in `.env`:

```env
CORS_ORIGINS=http://localhost:3000,https://myapp.com,exp://192.168.1.100:19000
```

## 📱 Integration with Expo/React Native

### Example: Fetch from React Native

```typescript
import { useState } from 'react';

const API_URL = 'http://localhost:8000/api';

export function useLyxBot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      return data.message;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
```

### Example: With Conversation History

```typescript
const [history, setHistory] = useState<Array<{role: string, content: string}>>([]);

const sendMessageWithHistory = async (message: string) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_history: history,
    }),
  });

  const data = await response.json();
  
  // Update history
  setHistory([
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: data.message },
  ]);

  return data.message;
};
```

## 🧪 Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8000/api/health

# Get available models
curl http://localhost:8000/api/models

# Send a chat message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

### Testing with Python

```python
import requests

# Test health endpoint
response = requests.get('http://localhost:8000/api/health')
print(response.json())

# Test chat endpoint
response = requests.post(
    'http://localhost:8000/api/chat',
    json={
        'message': 'Hello!',
        'model': 'gpt-3.5-turbo'
    }
)
print(response.json())
```

## 📦 Project Structure

```
lyxbot-backend/
├── main.py              # FastAPI application entry point
├── routers.py           # API route definitions
├── service.py           # Business logic and OpenAI integration
├── models.py            # Pydantic data models
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔒 Security Best Practices

1. **Never commit `.env` files**: API keys should never be in version control
2. **Use environment variables**: Store sensitive data in `.env` files
3. **Rotate API keys regularly**: Update your OpenAI API keys periodically
4. **Monitor usage**: Keep track of API usage in OpenAI dashboard
5. **Rate limiting**: Consider implementing rate limiting for production
6. **HTTPS in production**: Always use HTTPS in production environments

## 🐛 Troubleshooting

### OpenAI API Key Not Configured

**Error**: `OpenAI API key is not configured`

**Solution**: Make sure you have:
1. Created a `.env` file from `.env.example`
2. Added your OpenAI API key to `.env`
3. Restarted the server after updating `.env`

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**: Add your frontend origin to `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://yourfrontend.com
```

### Port Already in Use

**Error**: `Address already in use`

**Solution**: Either:
1. Stop the process using port 8000
2. Change the port in `.env`: `PORT=8001`

## 🚀 Deployment

### Production Considerations

1. **Use production ASGI server**: The built-in server is for development only
2. **Set `RELOAD=false`**: Disable auto-reload in production
3. **Use HTTPS**: Always use SSL/TLS in production
4. **Set proper CORS origins**: Restrict to your actual domains
5. **Implement authentication**: Add API key or JWT authentication
6. **Add rate limiting**: Prevent abuse
7. **Monitor logs**: Set up proper logging and monitoring
8. **Use environment secrets**: Store API keys in secure vault services

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t lyxbot-backend .
docker run -p 8000:8000 --env-file .env lyxbot-backend
```

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

## 📄 License

This project is part of the Expo monorepo and follows its licensing terms.

## 🤝 Contributing

Contributions are welcome! Please follow the coding standards and add tests for new features.

## 💬 Support

For issues and questions:
- Check the [API documentation](http://localhost:8000/docs)
- Review this README
- Open an issue in the repository
