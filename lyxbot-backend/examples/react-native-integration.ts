/**
 * LyxBot React Native/Expo Integration Example
 * 
 * This file demonstrates how to integrate the LyxBot API
 * into an Expo/React Native application.
 */

import { useState, useCallback } from 'react';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  model: string;
  timestamp: string;
  tokens_used?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  max_tokens: number;
}

export interface LyxBotConfig {
  apiUrl?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
}

// Configuration
const DEFAULT_CONFIG: Required<LyxBotConfig> = {
  apiUrl: 'http://localhost:8000/api',
  defaultModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 150,
};

/**
 * Custom hook for LyxBot integration
 */
export function useLyxBot(config: LyxBotConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  /**
   * Send a message to LyxBot
   */
  const sendMessage = useCallback(async (
    message: string,
    options?: {
      includeHistory?: boolean;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${finalConfig.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: options?.includeHistory ? conversationHistory : undefined,
          model: options?.model || finalConfig.defaultModel,
          temperature: options?.temperature ?? finalConfig.temperature,
          max_tokens: options?.maxTokens ?? finalConfig.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response from LyxBot');
      }

      const data: ChatResponse = await response.json();

      // Update conversation history
      if (options?.includeHistory) {
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: message },
          { role: 'assistant', content: data.message },
        ]);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [finalConfig, conversationHistory]);

  /**
   * Get available models
   */
  const getModels = useCallback(async (): Promise<ModelInfo[]> => {
    try {
      const response = await fetch(`${finalConfig.apiUrl}/models`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      throw err;
    }
  }, [finalConfig.apiUrl]);

  /**
   * Check API health
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${finalConfig.apiUrl}/health`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'healthy' && data.openai_configured;
    } catch (err) {
      return false;
    }
  }, [finalConfig.apiUrl]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    sendMessage,
    getModels,
    checkHealth,
    clearHistory,
    loading,
    error,
    conversationHistory,
  };
}

/**
 * LyxBot API client (non-hook version)
 */
export class LyxBotClient {
  private config: Required<LyxBotConfig>;

  constructor(config: LyxBotConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Send a message to LyxBot
   */
  async sendMessage(
    message: string,
    options?: {
      conversationHistory?: ChatMessage[];
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.config.apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history: options?.conversationHistory,
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.maxTokens ?? this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get response from LyxBot');
    }

    return response.json();
  }

  /**
   * Get available models
   */
  async getModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.config.apiUrl}/models`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.models;
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{
    status: string;
    version: string;
    timestamp: string;
    openai_configured: boolean;
  }> {
    const response = await fetch(`${this.config.apiUrl}/health`);
    
    if (!response.ok) {
      throw new Error('Failed to check health');
    }

    return response.json();
  }
}
