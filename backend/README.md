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

- **MessageRole**: An enum defining valid message roles ('system', 'user', 'assistant')
- **ChatMessage**: A dataclass representing chat messages with role and content validation
- **chat_completion()**: Function to generate chat completions using OpenAI's API

#### Features

- **Input validation**: Validates message roles, temperature range, and message list
- **Error handling**: Comprehensive error handling for API failures and invalid inputs
- **Lazy initialization**: OpenAI client is initialized only when needed
- **Secure**: API key is loaded from environment variables, never hardcoded

#### Usage Example

```python
from app.services.openai_service import ChatMessage, chat_completion, MessageRole

# Create messages
messages = [
    ChatMessage(role=MessageRole.SYSTEM.value, content="You are a helpful assistant."),
    ChatMessage(role=MessageRole.USER.value, content="Hello, how are you?")
]

# Get completion
response = chat_completion(messages, temperature=0.7)
print(response.choices[0].message.content)
```

#### Running Examples

A comprehensive example script is provided in `examples/chat_example.py`:

```bash
cd backend
PYTHONPATH=. python examples/chat_example.py
```

This script demonstrates:
- Basic chat completions
- Multi-turn conversations
- Temperature parameter effects

## Security

- The `.env` file is excluded from version control via `.gitignore`
- Never commit API keys or sensitive credentials to the repository
