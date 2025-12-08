# LyxBot Integration Examples

This directory contains example code demonstrating how to integrate the LyxBot API into your Expo/React Native applications.

## Files

### `react-native-integration.ts`

TypeScript integration module providing:
- **`useLyxBot()`** - React hook for easy integration
- **`LyxBotClient`** - Class-based API client for non-React code
- Type definitions for all API models

### `ChatScreen.tsx`

Complete example of a chat interface component featuring:
- Real-time messaging with LyxBot
- Conversation history management
- Loading states and error handling
- Clean, modern UI design
- Keyboard handling for mobile devices

## Quick Start

### 1. Copy Integration Module

Copy `react-native-integration.ts` to your project:

```bash
cp react-native-integration.ts /path/to/your/project/src/lib/
```

### 2. Use the Hook in Your Component

```typescript
import { useLyxBot } from './lib/react-native-integration';

function MyComponent() {
  const { sendMessage, loading, error } = useLyxBot({
    apiUrl: 'http://your-server:8000/api',
  });

  const handleSend = async () => {
    const response = await sendMessage('Hello!');
    console.log(response.message);
  };

  return (
    // Your UI here
  );
}
```

### 3. Or Use the Class-Based Client

```typescript
import { LyxBotClient } from './lib/react-native-integration';

const client = new LyxBotClient({
  apiUrl: 'http://your-server:8000/api',
});

// Send a message
const response = await client.sendMessage('Hello!');
console.log(response.message);

// Get available models
const models = await client.getModels();
console.log(models);

// Check health
const health = await client.checkHealth();
console.log(health.openai_configured);
```

## Using the Chat Screen Example

### Option 1: Copy the Component

Copy `ChatScreen.tsx` to your project and use it:

```typescript
import ChatScreen from './screens/ChatScreen';

// In your navigation
<Stack.Screen name="Chat" component={ChatScreen} />
```

### Option 2: Learn from the Example

Use the `ChatScreen.tsx` as a reference to build your own custom UI:
- Study the state management patterns
- See how to handle loading and errors
- Learn conversation history management
- Understand the message rendering logic

## Configuration

### API URL Configuration

Update the API URL based on your deployment:

**Development (iOS Simulator):**
```typescript
apiUrl: 'http://localhost:8000/api'
```

**Development (Android Emulator):**
```typescript
apiUrl: 'http://10.0.2.2:8000/api'
```

**Development (Physical Device):**
```typescript
apiUrl: 'http://192.168.x.x:8000/api'  // Your computer's local IP
```

**Production:**
```typescript
apiUrl: 'https://your-domain.com/api'
```

### Finding Your Local IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)

## Features Demonstrated

### `useLyxBot` Hook Features

- ✅ Send messages with optional conversation history
- ✅ Automatic loading state management
- ✅ Error handling with error state
- ✅ Conversation history tracking
- ✅ Health check functionality
- ✅ Model selection
- ✅ Configurable temperature and max tokens

### Chat Screen Features

- ✅ Modern chat interface
- ✅ User and bot message bubbles
- ✅ Auto-scroll to latest message
- ✅ Loading indicator
- ✅ Error alerts
- ✅ Clear conversation button
- ✅ Health status indicator
- ✅ Keyboard handling
- ✅ Multi-line input support

## Advanced Usage

### With Conversation History

```typescript
const { sendMessage, conversationHistory } = useLyxBot();

// Send message with conversation context
const response = await sendMessage('What did I just ask?', {
  includeHistory: true,  // Include previous messages
});
```

### Custom Model Selection

```typescript
const response = await sendMessage('Explain quantum physics', {
  model: 'gpt-4',  // Use GPT-4 instead of default
  temperature: 0.9,  // More creative responses
  maxTokens: 500,    // Longer responses
});
```

### Fetching Available Models

```typescript
const { getModels } = useLyxBot();

useEffect(() => {
  getModels().then(models => {
    console.log('Available models:', models);
    // Display in a picker/dropdown
  });
}, []);
```

### Health Monitoring

```typescript
const { checkHealth } = useLyxBot();

useEffect(() => {
  const interval = setInterval(async () => {
    const healthy = await checkHealth();
    if (!healthy) {
      Alert.alert('API Offline', 'LyxBot API is currently unavailable');
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
}, [checkHealth]);
```

## TypeScript Support

All examples include full TypeScript support with:
- Type-safe API calls
- Intellisense/autocomplete
- Compile-time error checking
- Documented interfaces

## Error Handling

The integration automatically handles common errors:

```typescript
const { sendMessage, error } = useLyxBot();

useEffect(() => {
  if (error) {
    // Handle error in your UI
    Alert.alert('Error', error);
  }
}, [error]);
```

## Testing

### Test API Connection

```typescript
import { LyxBotClient } from './lib/react-native-integration';

const testConnection = async () => {
  const client = new LyxBotClient({
    apiUrl: 'http://localhost:8000/api',
  });

  try {
    const health = await client.checkHealth();
    console.log('✅ Connection successful:', health);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
};
```

### Test Message Sending

```typescript
const testMessage = async () => {
  const client = new LyxBotClient();
  
  try {
    const response = await client.sendMessage('Hello, LyxBot!');
    console.log('✅ Response:', response.message);
  } catch (err) {
    console.error('❌ Failed:', err);
  }
};
```

## Troubleshooting

### "Network request failed"

- Verify the backend server is running
- Check the API URL is correct for your platform
- Ensure CORS is properly configured on the backend
- Try pinging the API URL in your browser

### "OpenAI API key is not configured"

- Set up `.env` file in the backend
- Add your OpenAI API key
- Restart the backend server

### Messages not showing up

- Check browser/React Native debugger console for errors
- Verify network requests in Network tab
- Ensure state updates are triggering re-renders

## Next Steps

1. Customize the UI to match your app's design
2. Add authentication/authorization
3. Implement message persistence (save to database)
4. Add support for images and rich media
5. Implement typing indicators
6. Add message reactions/feedback
7. Create preset prompts/quick replies

## Support

For issues or questions:
- Check the main [README.md](../README.md)
- Review the [API documentation](http://localhost:8000/docs)
- Open an issue in the repository

## License

These examples are provided as part of the LyxBot platform for educational and development purposes.
