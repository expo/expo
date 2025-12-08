"""
Test script to verify the OpenAI service structure without making API calls.
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.openai_service import ChatMessage, chat_completion

def test_chat_message():
    """Test ChatMessage dataclass."""
    msg = ChatMessage(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"
    
    msg_dict = msg.to_dict()
    assert msg_dict == {"role": "user", "content": "Hello"}
    print("✓ ChatMessage tests passed")

def test_imports():
    """Test that all imports work."""
    # Verify the function exists
    assert callable(chat_completion)
    print("✓ Import tests passed")

if __name__ == "__main__":
    print("Running OpenAI service tests...")
    test_chat_message()
    test_imports()
    print("\n✓ All tests passed!")
    print("\nNote: API call tests require a valid OPENAI_API_KEY in .env file")
