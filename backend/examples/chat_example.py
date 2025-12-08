#!/usr/bin/env python3
"""
Example script demonstrating usage of the OpenAI service for lyxbot platform.

Before running:
1. Create a .env file in the project root with your OpenAI API key:
   OPENAI_API_KEY=your-api-key-here
2. Install dependencies: pip install -r requirements.txt
3. Run: python examples/chat_example.py
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.openai_service import ChatMessage, chat_completion, MessageRole


def example_basic_chat():
    """Example of a basic chat completion."""
    print("=" * 60)
    print("Example 1: Basic Chat Completion")
    print("=" * 60)
    
    messages = [
        ChatMessage(
            role=MessageRole.SYSTEM.value,
            content="You are a helpful AI assistant."
        ),
        ChatMessage(
            role=MessageRole.USER.value,
            content="What is the capital of France?"
        )
    ]
    
    try:
        response = chat_completion(messages, temperature=0.7)
        print(f"\nUser: {messages[1].content}")
        print(f"Assistant: {response.choices[0].message.content}")
        print(f"\nTokens used: {response.usage.total_tokens}")
    except Exception as e:
        print(f"Error: {e}")
    
    print()


def example_conversation():
    """Example of a multi-turn conversation."""
    print("=" * 60)
    print("Example 2: Multi-turn Conversation")
    print("=" * 60)
    
    messages = [
        ChatMessage(
            role=MessageRole.SYSTEM.value,
            content="You are a knowledgeable tutor helping students learn programming."
        ),
        ChatMessage(
            role=MessageRole.USER.value,
            content="Can you explain what a variable is in programming?"
        )
    ]
    
    try:
        # First response
        response = chat_completion(messages, temperature=0.5)
        assistant_message = response.choices[0].message.content
        print(f"\nUser: {messages[1].content}")
        print(f"Assistant: {assistant_message}")
        
        # Add assistant's response to conversation
        messages.append(
            ChatMessage(
                role=MessageRole.ASSISTANT.value,
                content=assistant_message
            )
        )
        
        # Follow-up question
        messages.append(
            ChatMessage(
                role=MessageRole.USER.value,
                content="Can you give me a simple code example?"
            )
        )
        
        # Second response
        response2 = chat_completion(messages, temperature=0.5)
        print(f"\nUser: {messages[3].content}")
        print(f"Assistant: {response2.choices[0].message.content}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    print()


def example_temperature_comparison():
    """Example showing the effect of different temperature values."""
    print("=" * 60)
    print("Example 3: Temperature Comparison")
    print("=" * 60)
    
    base_messages = [
        ChatMessage(
            role=MessageRole.SYSTEM.value,
            content="You are a creative writing assistant."
        ),
        ChatMessage(
            role=MessageRole.USER.value,
            content="Write a one-sentence story about a robot."
        )
    ]
    
    temperatures = [0.2, 0.7, 1.5]
    
    for temp in temperatures:
        try:
            response = chat_completion(base_messages, temperature=temp)
            print(f"\nTemperature {temp}:")
            print(response.choices[0].message.content)
        except Exception as e:
            print(f"Error at temperature {temp}: {e}")
    
    print()


def main():
    """Run all examples."""
    print("\n" + "=" * 60)
    print("OpenAI Service Examples for lyxbot Platform")
    print("=" * 60 + "\n")
    
    # Check if API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not found in environment.")
        print("Please create a .env file with your API key.")
        sys.exit(1)
    
    # Run examples
    example_basic_chat()
    example_conversation()
    example_temperature_comparison()
    
    print("=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
