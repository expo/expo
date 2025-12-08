# Lyxbot Backend

This directory contains the backend services for the lyxbot platform, including OpenAI API integration.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your-actual-api-key-here
     ```

## Services

### OpenAI Service

Located at `app/services/openai_service.py`, this service provides:

- **ChatMessage**: A dataclass representing chat messages with role and content
- **chat_completion()**: Function to generate chat completions using OpenAI's API

#### Usage Example

```python
from app.services.openai_service import ChatMessage, chat_completion

# Create messages
messages = [
    ChatMessage(role="system", content="You are a helpful assistant."),
    ChatMessage(role="user", content="Hello, how are you?")
]

# Get completion
response = chat_completion(messages, temperature=0.7)
print(response.choices[0].message.content)
```

## Security

- The `.env` file is excluded from version control via `.gitignore`
- Never commit API keys or sensitive credentials to the repository
