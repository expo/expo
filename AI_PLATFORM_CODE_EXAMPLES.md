# Code Examples: Implementing AI Platform and LyxBot

This document provides practical code examples for implementing an AI platform and bot system using Expo's modular architecture.

## Table of Contents
- [Creating a New Module](#creating-a-new-module)
- [Basic Bot Module Implementation](#basic-bot-module-implementation)
- [Platform-Specific AI Implementation](#platform-specific-ai-implementation)
- [Event-Driven Bot Communication](#event-driven-bot-communication)
- [Shared Object for Bot State](#shared-object-for-bot-state)
- [Integration Examples](#integration-examples)

---

## Creating a New Module

### Step 1: Create Module Structure

```bash
# Create new module for your bot
npx create-expo-module lyxbot-ai-module

# This creates:
# lyxbot-ai-module/
#   ├── android/
#   ├── ios/
#   ├── src/
#   ├── expo-module.config.json
#   └── package.json
```

### Step 2: Configure Module

**expo-module.config.json**
```json
{
  "platforms": ["ios", "android", "web"],
  "ios": {
    "modules": ["LyxBotModule"]
  },
  "android": {
    "modules": ["expo.modules.lyxbot.LyxBotModule"]
  },
  "web": {}
}
```

---

## Basic Bot Module Implementation

### JavaScript/TypeScript API (src/index.ts)

```typescript
import { EventEmitter, NativeModule, requireNativeModule } from 'expo-modules-core';

// Define the native module interface
const LyxBotNativeModule: NativeModule = requireNativeModule('LyxBot');

// Event emitter for bot events
export const botEvents = new EventEmitter(LyxBotNativeModule);

// Bot configuration interface
export interface BotConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Bot response interface
export interface BotResponse {
  message: string;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Main Bot API
export class LyxBot {
  /**
   * Initialize the bot with configuration
   */
  static async initialize(config: BotConfig): Promise<void> {
    return LyxBotNativeModule.initialize(config);
  }

  /**
   * Send a message to the bot and get a response
   */
  static async sendMessage(message: string): Promise<BotResponse> {
    return LyxBotNativeModule.sendMessage(message);
  }

  /**
   * Process text with AI/ML
   */
  static async processText(text: string): Promise<string> {
    return LyxBotNativeModule.processText(text);
  }

  /**
   * Get bot status
   */
  static async getStatus(): Promise<{
    isActive: boolean;
    model: string;
    version: string;
  }> {
    return LyxBotNativeModule.getStatus();
  }

  /**
   * Shutdown the bot
   */
  static async shutdown(): Promise<void> {
    return LyxBotNativeModule.shutdown();
  }
}

// Event listener helpers
export function onBotReply(callback: (response: BotResponse) => void) {
  return botEvents.addListener('onBotReply', callback);
}

export function onBotError(callback: (error: Error) => void) {
  return botEvents.addListener('onBotError', callback);
}

export function onBotStatusChange(callback: (status: string) => void) {
  return botEvents.addListener('onBotStatusChange', callback);
}

// Export types
export type { BotConfig, BotResponse };
```

### Web Implementation (src/index.web.ts)

```typescript
import { EventEmitter } from 'expo-modules-core';

// Web implementation using browser APIs and TensorFlow.js
export interface BotConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface BotResponse {
  message: string;
  confidence: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class WebBotEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  addListener(eventName: string, callback: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    return {
      remove: () => {
        this.listeners.get(eventName)?.delete(callback);
      },
    };
  }

  emit(eventName: string, data: any) {
    this.listeners.get(eventName)?.forEach((callback) => callback(data));
  }
}

export const botEvents = new WebBotEventEmitter();

export class LyxBot {
  private static config: BotConfig | null = null;
  private static isInitialized = false;

  static async initialize(config: BotConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
    
    // Initialize TensorFlow.js or connect to API
    console.log('LyxBot initialized on web with config:', config);
    
    botEvents.emit('onBotStatusChange', 'initialized');
  }

  static async sendMessage(message: string): Promise<BotResponse> {
    if (!this.isInitialized) {
      throw new Error('Bot not initialized. Call initialize() first.');
    }

    // Simulate AI processing (replace with actual API call or TensorFlow.js)
    const response: BotResponse = {
      message: `Echo: ${message}`,
      confidence: 0.95,
      timestamp: Date.now(),
      metadata: { platform: 'web' },
    };

    // Emit reply event
    botEvents.emit('onBotReply', response);

    return response;
  }

  static async processText(text: string): Promise<string> {
    // Implement text processing logic
    return text.toLowerCase();
  }

  static async getStatus() {
    return {
      isActive: this.isInitialized,
      model: this.config?.model || 'default',
      version: '1.0.0',
    };
  }

  static async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.config = null;
    botEvents.emit('onBotStatusChange', 'shutdown');
  }
}

export function onBotReply(callback: (response: BotResponse) => void) {
  return botEvents.addListener('onBotReply', callback);
}

export function onBotError(callback: (error: Error) => void) {
  return botEvents.addListener('onBotError', callback);
}

export function onBotStatusChange(callback: (status: string) => void) {
  return botEvents.addListener('onBotStatusChange', callback);
}
```

---

## Platform-Specific AI Implementation

### Android Implementation (android/src/main/java/expo/modules/lyxbot/LyxBotModule.kt)

```kotlin
package expo.modules.lyxbot

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class LyxBotModule : Module() {
  private var botEngine: BotEngine? = null

  override fun definition() = ModuleDefinition {
    // Module name
    Name("LyxBot")

    // Events
    Events("onBotReply", "onBotError", "onBotStatusChange")

    // Initialize bot
    AsyncFunction("initialize") { config: Map<String, Any?> ->
      val apiKey = config["apiKey"] as? String
      val model = config["model"] as? String ?: "default"
      val temperature = (config["temperature"] as? Number)?.toFloat() ?: 0.7f
      val maxTokens = (config["maxTokens"] as? Number)?.toInt() ?: 100

      botEngine = BotEngine(
        apiKey = apiKey,
        model = model,
        temperature = temperature,
        maxTokens = maxTokens
      )

      sendEvent("onBotStatusChange", mapOf("status" to "initialized"))
    }

    // Send message to bot
    AsyncFunction("sendMessage") { message: String ->
      val engine = botEngine ?: throw Exception("Bot not initialized")

      // Process message in background
      val response = engine.processMessage(message)

      // Emit event with response
      sendEvent("onBotReply", mapOf(
        "message" to response.message,
        "confidence" to response.confidence,
        "timestamp" to System.currentTimeMillis(),
        "metadata" to response.metadata
      ))

      // Return response
      mapOf(
        "message" to response.message,
        "confidence" to response.confidence,
        "timestamp" to System.currentTimeMillis(),
        "metadata" to response.metadata
      )
    }

    // Process text with ML
    AsyncFunction("processText") { text: String ->
      val engine = botEngine ?: throw Exception("Bot not initialized")
      engine.processText(text)
    }

    // Get bot status
    Function("getStatus") {
      mapOf(
        "isActive" to (botEngine != null),
        "model" to (botEngine?.model ?: "none"),
        "version" to "1.0.0"
      )
    }

    // Shutdown bot
    Function("shutdown") {
      botEngine?.shutdown()
      botEngine = null
      sendEvent("onBotStatusChange", mapOf("status" to "shutdown"))
    }

    // Called when module is destroyed
    OnDestroy {
      botEngine?.shutdown()
      botEngine = null
    }
  }
}

// Bot engine implementation
class BotEngine(
  private val apiKey: String?,
  val model: String,
  private val temperature: Float,
  private val maxTokens: Int
) {
  // Initialize ML Kit or TensorFlow Lite here
  init {
    // Load AI model
    println("BotEngine initialized with model: $model")
  }

  data class Response(
    val message: String,
    val confidence: Float,
    val metadata: Map<String, Any>
  )

  suspend fun processMessage(message: String): Response {
    // TODO: Implement actual AI processing using:
    // - Google ML Kit for NLP
    // - TensorFlow Lite for custom models
    // - API calls to cloud services

    // Simulate processing
    return Response(
      message = "Processed: $message",
      confidence = 0.95f,
      metadata = mapOf("platform" to "android", "model" to model)
    )
  }

  suspend fun processText(text: String): String {
    // Implement text processing
    return text.toLowerCase()
  }

  fun shutdown() {
    // Clean up resources
    println("BotEngine shutting down")
  }
}
```

### iOS Implementation (ios/LyxBotModule.swift)

```swift
import ExpoModulesCore
import CoreML
import NaturalLanguage

public class LyxBotModule: Module {
  private var botEngine: BotEngine?

  public func definition() -> ModuleDefinition {
    // Module name
    Name("LyxBot")

    // Events
    Events("onBotReply", "onBotError", "onBotStatusChange")

    // Initialize bot
    AsyncFunction("initialize") { (config: [String: Any]) in
      let apiKey = config["apiKey"] as? String
      let model = config["model"] as? String ?? "default"
      let temperature = config["temperature"] as? Double ?? 0.7
      let maxTokens = config["maxTokens"] as? Int ?? 100

      self.botEngine = BotEngine(
        apiKey: apiKey,
        model: model,
        temperature: temperature,
        maxTokens: maxTokens
      )

      self.sendEvent("onBotStatusChange", ["status": "initialized"])
    }

    // Send message to bot
    AsyncFunction("sendMessage") { (message: String) -> [String: Any] in
      guard let engine = self.botEngine else {
        throw NSError(domain: "LyxBot", code: 1, userInfo: [
          NSLocalizedDescriptionKey: "Bot not initialized"
        ])
      }

      // Process message
      let response = try await engine.processMessage(message)

      // Emit event with response
      self.sendEvent("onBotReply", [
        "message": response.message,
        "confidence": response.confidence,
        "timestamp": Int(Date().timeIntervalSince1970 * 1000),
        "metadata": response.metadata
      ])

      // Return response
      return [
        "message": response.message,
        "confidence": response.confidence,
        "timestamp": Int(Date().timeIntervalSince1970 * 1000),
        "metadata": response.metadata
      ]
    }

    // Process text with ML
    AsyncFunction("processText") { (text: String) -> String in
      guard let engine = self.botEngine else {
        throw NSError(domain: "LyxBot", code: 1, userInfo: [
          NSLocalizedDescriptionKey: "Bot not initialized"
        ])
      }
      return try await engine.processText(text)
    }

    // Get bot status
    Function("getStatus") {
      return [
        "isActive": self.botEngine != nil,
        "model": self.botEngine?.model ?? "none",
        "version": "1.0.0"
      ]
    }

    // Shutdown bot
    Function("shutdown") {
      self.botEngine?.shutdown()
      self.botEngine = nil
      self.sendEvent("onBotStatusChange", ["status": "shutdown"])
    }

    // Called when module is destroyed
    OnDestroy {
      self.botEngine?.shutdown()
      self.botEngine = nil
    }
  }
}

// Bot engine implementation
class BotEngine {
  let model: String
  private let apiKey: String?
  private let temperature: Double
  private let maxTokens: Int
  
  // NLP tagger for text processing
  private let tagger = NLTagger(tagSchemes: [.nameType, .lexicalClass])

  init(apiKey: String?, model: String, temperature: Double, maxTokens: Int) {
    self.apiKey = apiKey
    self.model = model
    self.temperature = temperature
    self.maxTokens = maxTokens
    
    print("BotEngine initialized with model: \(model)")
  }

  struct Response {
    let message: String
    let confidence: Double
    let metadata: [String: Any]
  }

  func processMessage(_ message: String) async throws -> Response {
    // TODO: Implement actual AI processing using:
    // - Core ML for custom models
    // - Natural Language framework
    // - API calls to cloud services

    // Simulate processing
    return Response(
      message: "Processed: \(message)",
      confidence: 0.95,
      metadata: ["platform": "ios", "model": model]
    )
  }

  func processText(_ text: String) async throws -> String {
    // Use Natural Language framework
    tagger.string = text
    
    // Perform text processing
    var processedText = text.lowercased()
    
    return processedText
  }

  func shutdown() {
    print("BotEngine shutting down")
  }
}
```

---

## Event-Driven Bot Communication

### React Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import { LyxBot, onBotReply, BotResponse } from 'lyxbot-ai-module';

export function ChatScreen() {
  const [messages, setMessages] = useState<BotResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize bot
    LyxBot.initialize({
      apiKey: 'your-api-key',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 150,
    }).then(() => {
      setIsInitialized(true);
    });

    // Listen for bot replies
    const subscription = onBotReply((response) => {
      setMessages((prev) => [...prev, response]);
    });

    // Cleanup
    return () => {
      subscription.remove();
      LyxBot.shutdown();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !isInitialized) return;

    try {
      // Send message to bot
      const response = await LyxBot.sendMessage(inputText);
      
      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          message: inputText,
          confidence: 1.0,
          timestamp: Date.now(),
          metadata: { sender: 'user' },
        },
      ]);

      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              backgroundColor:
                item.metadata?.sender === 'user' ? '#e3f2fd' : '#f5f5f5',
              margin: 5,
              borderRadius: 10,
            }}
          >
            <Text>{item.message}</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>
              {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, borderRadius: 5, padding: 10 }}
        />
        <Button title="Send" onPress={handleSend} disabled={!isInitialized} />
      </View>
    </View>
  );
}
```

---

## Shared Object for Bot State

### JavaScript API with Shared Object

```typescript
// src/LyxBotInstance.ts
import { SharedObject } from 'expo-modules-core';

export class LyxBotInstance extends SharedObject {
  /**
   * Send a message to the bot instance
   */
  async sendMessage(message: string): Promise<string> {
    return await this.call('sendMessage', message);
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<Array<{ role: string; content: string }>> {
    return await this.call('getHistory');
  }

  /**
   * Clear conversation history
   */
  async clearHistory(): Promise<void> {
    return await this.call('clearHistory');
  }

  /**
   * Set bot personality
   */
  async setPersonality(personality: string): Promise<void> {
    return await this.call('setPersonality', personality);
  }

  /**
   * Get current bot status
   */
  get isActive(): boolean {
    return this.get('isActive');
  }

  /**
   * Add listener for bot events
   */
  addListener(eventName: string, callback: Function) {
    return this.on(eventName, callback);
  }
}

// Export factory function
export function createBotInstance(config: {
  apiKey: string;
  model: string;
}): LyxBotInstance {
  const { LyxBot } = requireNativeModule('LyxBot');
  return new LyxBotInstance(LyxBot.createInstance(config));
}
```

### Android Shared Object Implementation

```kotlin
// android/src/main/java/expo/modules/lyxbot/LyxBotInstance.kt
import expo.modules.kotlin.sharedobjects.SharedObject

class LyxBotInstance(
  private val apiKey: String,
  private val model: String
) : SharedObject() {
  private val conversationHistory = mutableListOf<Message>()
  private var personality: String = "helpful assistant"

  data class Message(val role: String, val content: String)

  override fun getSharedObjectId(): Int {
    return super.getSharedObjectId()
  }

  fun sendMessage(message: String): String {
    // Add user message to history
    conversationHistory.add(Message("user", message))

    // Process with AI
    val response = processWithAI(message)

    // Add bot response to history
    conversationHistory.add(Message("assistant", response))

    // Emit event
    emit("onMessage", mapOf("message" to response))

    return response
  }

  fun getHistory(): List<Map<String, String>> {
    return conversationHistory.map { 
      mapOf("role" to it.role, "content" to it.content)
    }
  }

  fun clearHistory() {
    conversationHistory.clear()
  }

  fun setPersonality(newPersonality: String) {
    personality = newPersonality
  }

  fun isActive(): Boolean {
    return true
  }

  private fun processWithAI(message: String): String {
    // Implement AI processing
    return "Response to: $message"
  }

  override fun deallocate() {
    // Cleanup when object is deallocated
    conversationHistory.clear()
  }
}
```

### iOS Shared Object Implementation

```swift
// ios/LyxBotInstance.swift
import ExpoModulesCore

public class LyxBotInstance: SharedObject {
  private var conversationHistory: [[String: String]] = []
  private var personality: String = "helpful assistant"
  private let apiKey: String
  private let model: String

  init(apiKey: String, model: String) {
    self.apiKey = apiKey
    self.model = model
  }

  func sendMessage(_ message: String) -> String {
    // Add user message to history
    conversationHistory.append(["role": "user", "content": message])

    // Process with AI
    let response = processWithAI(message)

    // Add bot response to history
    conversationHistory.append(["role": "assistant", "content": response])

    // Emit event
    emit(event: "onMessage", arguments: ["message": response])

    return response
  }

  func getHistory() -> [[String: String]] {
    return conversationHistory
  }

  func clearHistory() {
    conversationHistory.removeAll()
  }

  func setPersonality(_ newPersonality: String) {
    personality = newPersonality
  }

  var isActive: Bool {
    return true
  }

  private func processWithAI(_ message: String) -> String {
    // Implement AI processing using Core ML
    return "Response to: \(message)"
  }

  public override func deallocate() {
    // Cleanup when object is deallocated
    conversationHistory.removeAll()
  }
}
```

---

## Integration Examples

### Complete App Integration

```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatScreen } from './screens/ChatScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Using Multiple Bot Instances

```typescript
import { createBotInstance, LyxBotInstance } from 'lyxbot-ai-module';

// Create multiple bot instances with different personalities
const assistantBot = createBotInstance({
  apiKey: 'key-1',
  model: 'gpt-4',
});
await assistantBot.setPersonality('helpful assistant');

const creativeBot = createBotInstance({
  apiKey: 'key-2',
  model: 'gpt-4',
});
await creativeBot.setPersonality('creative writer');

// Use them independently
const response1 = await assistantBot.sendMessage('How do I code?');
const response2 = await creativeBot.sendMessage('Write a poem');
```

---

## Best Practices

1. **Always initialize the bot before use**
2. **Clean up event listeners** when components unmount
3. **Handle errors gracefully** with try-catch blocks
4. **Use TypeScript** for type safety
5. **Test on all platforms** (iOS, Android, Web)
6. **Optimize for performance** - use background threads for heavy AI processing
7. **Secure API keys** - don't hardcode them, use environment variables
8. **Implement proper state management** for complex apps

---

These examples provide a foundation for building your AI platform with LyxBot. Customize them based on your specific requirements!
