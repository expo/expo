import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { GlassCard } from '@/components/GlassCard';
import { LivingPulse, LifeOrb } from '@/components/LivingPulse';
import { useController } from '@/context/ControllerContext';
import { colors, fonts, radii, spacing, brand } from '@/constants/theme';
import { generateAPIUrl } from '@/utils/api';
import { streamDemoReply } from '@/utils/demoStream';

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text as string)
    .join('');
}

export function MainAgentWindow() {
  const { selectedAgent, selectedId, setAgentStatus, selectAgent } = useController();
  const [input, setInput] = useState('');
  const [demoMessages, setDemoMessages] = useState<
    { id: string; role: 'user' | 'assistant'; text: string }[]
  >([]);
  const [demoStreaming, setDemoStreaming] = useState(false);
  const useDemo = !process.env.EXPO_PUBLIC_AI_GATEWAY_API_KEY && !process.env.AI_GATEWAY_API_KEY;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        fetch: expoFetch as unknown as typeof globalThis.fetch,
        api: generateAPIUrl('/api/chat'),
        body: {
          agentId: selectedId,
          systemPrompt: selectedAgent.systemPrompt,
        },
      }),
    [selectedId, selectedAgent.systemPrompt],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: selectedId,
    transport,
    onError: (err) => console.warn('[mstrmnd]', err.message),
  });

  const isStreaming = status === 'streaming' || status === 'submitted' || demoStreaming;

  useEffect(() => {
    setAgentStatus(selectedId, isStreaming ? 'streaming' : 'listening');
  }, [isStreaming, selectedId, setAgentStatus]);

  useEffect(() => {
    setDemoMessages([]);
    setMessages([]);
  }, [selectedId, setMessages]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');

    if (useDemo || error) {
      const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text };
      setDemoMessages((m) => [...m, userMsg]);
      setDemoStreaming(true);
      setAgentStatus(selectedId, 'streaming');
      const assistantId = `a-${Date.now()}`;
      setDemoMessages((m) => [...m, { id: assistantId, role: 'assistant', text: '' }]);
      await streamDemoReply(selectedAgent, text, (chunk) => {
        setDemoMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, text: msg.text + chunk } : msg,
          ),
        );
      });
      setDemoStreaming(false);
      setAgentStatus(selectedId, 'listening');
      return;
    }

    await sendMessage({ text });
  };

  const displayMessages =
    useDemo || error || demoMessages.length > 0
      ? demoMessages
      : messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          text: messageText(m.parts as { type: string; text?: string }[]),
        }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.shell}
    >
      <GlassCard style={styles.window} padded={false} fill>
        <Pressable
          onPress={() => selectAgent('conductor')}
          style={[
            styles.header,
            selectedId === 'conductor' && { borderBottomColor: `${colors.signal}55` },
          ]}
        >
          <LifeOrb color={selectedAgent.accent} active={isStreaming || selectedId === 'conductor'} />
          <View style={styles.headerText}>
            <Text style={styles.brandLine}>{brand.wordmark} · main window</Text>
            <Text style={[styles.agentName, { color: selectedAgent.accent }]}>
              {selectedAgent.name}
            </Text>
            <Text style={styles.role} numberOfLines={1}>
              {selectedAgent.role}
            </Text>
          </View>
          <View style={styles.meter}>
            <LivingPulse
              color={selectedAgent.accent}
              active={isStreaming}
              intensity={isStreaming ? 0.95 : 0.4}
              bars={7}
            />
            <Text style={styles.level}>
              LV {selectedAgent.level} · {selectedAgent.xp} XP
            </Text>
          </View>
        </Pressable>

        <ScrollView
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          keyboardShouldPersistTaps="handled"
        >
          {displayMessages.length === 0 && (
            <Text style={styles.placeholder}>
              Hit a pad above, then cue {selectedAgent.name}. Ask about process, priorities, or
              handoffs across your mastermind grid.
            </Text>
          )}
          {displayMessages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.agentBubble]}
            >
              <Text style={styles.bubbleRole}>
                {m.role === 'user' ? 'YOU' : selectedAgent.name}
              </Text>
              <Text style={styles.bubbleText}>{m.text}</Text>
            </View>
          ))}
          {isStreaming && (
            <View style={styles.streamingRow}>
              <ActivityIndicator color={selectedAgent.accent} size="small" />
              <Text style={[styles.streamingLabel, { color: selectedAgent.accent }]}>
                {selectedAgent.name} processing…
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Cue ${selectedAgent.name}…`}
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onSend}
            returnKeyType="send"
            editable={!isStreaming}
          />
          <Pressable
            onPress={onSend}
            style={[styles.send, { backgroundColor: selectedAgent.accent }]}
            disabled={isStreaming || !input.trim()}
          >
            <Text style={styles.sendLabel}>RUN</Text>
          </Pressable>
        </View>
      </GlassCard>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
  },
  window: {
    flex: 1,
    borderRadius: radii.window,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  brandLine: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  agentName: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  role: {
    fontFamily: fonts.sans,
    color: colors.metal,
    fontSize: 11,
    marginTop: 1,
  },
  meter: {
    width: 88,
    alignItems: 'flex-end',
    gap: 4,
  },
  level: {
    fontFamily: fonts.sansMedium,
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  transcript: {
    flex: 1,
  },
  transcriptContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  placeholder: {
    fontFamily: fonts.sans,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  bubble: {
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.padPressed,
    borderColor: colors.hairline,
    maxWidth: '88%',
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chassis,
    borderColor: colors.bezel,
    maxWidth: '92%',
  },
  bubbleRole: {
    fontFamily: fonts.sansMedium,
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  bubbleText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  streamingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streamingLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.recess,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    color: colors.ink,
    backgroundColor: colors.pad,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.bezel,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
  },
  send: {
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendLabel: {
    fontFamily: fonts.displayBold,
    color: colors.ink,
    fontSize: 13,
    letterSpacing: 1,
  },
});
