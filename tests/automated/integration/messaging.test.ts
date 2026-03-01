import { describe, it, expect, beforeEach } from '@jest/globals';
import { MessageBridge } from '../../../src/integration/messageBridge';
import { EventBus } from '../../../src/integration/eventBus';

describe('Messaging Integration', () => {
  beforeEach(async () => {
    await MessageBridge.initialize();
  });

  it('should send message successfully', async () => {
    const messageId = await MessageBridge.send('chat1', 'Hello!');
    expect(messageId).toBeDefined();
    expect(messageId.length).toBeGreaterThan(0);
  });

  it('should mark messages as read', async () => {
    await MessageBridge.send('chat1', 'Test message');
    await expect(MessageBridge.markAsRead('chat1')).resolves.not.toThrow();
  });

  it('should store messages locally', async () => {
    await MessageBridge.send('chat1', 'Stored message');
    const messages = MessageBridge.getMessages('chat1');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should emit message events', (done) => {
    const unsubscribe = EventBus.subscribe('message:sent', (data) => {
      const { chatId, message } = data as { chatId: string; message: { text: string } };
      expect(chatId).toBe('chat1');
      expect(message.text).toBe('Event test');
      unsubscribe();
      done();
    });
    MessageBridge.send('chat1', 'Event test');
  });
});
