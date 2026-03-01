import { EventBus } from './eventBus';

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

const store: Record<string, Message[]> = {};

/**
 * Bridge between the TypeScript UI layer and the Rust messaging core.
 */
export const MessageBridge = {
  async initialize(): Promise<void> {
    // No-op stub; production wires up FFI bindings
  },

  async send(chatId: string, text: string): Promise<string> {
    const id = Math.random().toString(36).substring(2);
    const message: Message = { id, text, timestamp: Date.now() };
    if (!store[chatId]) {
      store[chatId] = [];
    }
    store[chatId].push(message);
    EventBus.emit('message:sent', { chatId, message });
    return id;
  },

  async markAsRead(chatId: string): Promise<void> {
    // No-op stub
    void chatId;
  },

  getMessages(chatId: string): Message[] {
    return store[chatId] ?? [];
  },
};
