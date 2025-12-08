"""
Test script to verify the OpenAI service structure without making API calls.
Run from the backend directory: python -m pytest tests/test_openai_service.py
Or with PYTHONPATH: PYTHONPATH=. python tests/test_openai_service.py
"""
from app.services.openai_service import ChatMessage, chat_completion, MessageRole

def test_chat_message():
    """Test ChatMessage dataclass."""
    msg = ChatMessage(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"
    
    msg_dict = msg.to_dict()
    assert msg_dict == {"role": "user", "content": "Hello"}
    print("✓ ChatMessage tests passed")

def test_chat_message_validation():
    """Test ChatMessage role validation."""
    # Test valid roles
    for role in ["system", "user", "assistant"]:
        msg = ChatMessage(role=role, content="test")
        assert msg.role == role
    
    # Test invalid role
    try:
        msg = ChatMessage(role="invalid", content="test")
        assert False, "Should have raised ValueError for invalid role"
    except ValueError as e:
        assert "Invalid role" in str(e)
    
    print("✓ ChatMessage validation tests passed")

def test_imports():
    """Test that all imports work."""
    # Verify the function exists
    assert callable(chat_completion)
    # Verify the enum exists
    assert MessageRole.SYSTEM.value == "system"
    assert MessageRole.USER.value == "user"
    assert MessageRole.ASSISTANT.value == "assistant"
    print("✓ Import tests passed")

def test_chat_completion_validation():
    """Test chat_completion input validation without calling API."""
    # Test empty messages
    try:
        chat_completion([])
        assert False, "Should have raised ValueError for empty messages"
    except ValueError as e:
        assert "cannot be empty" in str(e)
    
    # Test invalid temperature
    try:
        chat_completion([ChatMessage(role="user", content="test")], temperature=3.0)
        assert False, "Should have raised ValueError for invalid temperature"
    except ValueError as e:
        assert "temperature must be between" in str(e)
    
    print("✓ chat_completion validation tests passed")

if __name__ == "__main__":
    print("Running OpenAI service tests...")
    test_chat_message()
    test_chat_message_validation()
    test_imports()
    test_chat_completion_validation()
    print("\n✓ All tests passed!")
    print("\nNote: API call tests require a valid OPENAI_API_KEY in .env file")
