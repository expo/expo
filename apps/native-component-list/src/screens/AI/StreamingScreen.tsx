import { generateAsync } from 'expo-ai';
import { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import {
  ACTION_TITLES,
  AIResultPanel,
  buttonLayout,
  describeGeneration,
  describeSession,
  StatusRow,
  styles,
  ThemedTextInput,
  useAIAction,
  useSession,
} from './shared';

const STREAM_PROMPT =
  'Describe one day in the life of a lighthouse keeper in three short paragraphs: morning, afternoon, and night.';

export default function StreamingScreen() {
  const { outcome, pending, run, buttonProps } = useAIAction();
  const { session, create } = useSession();
  const [input, setInput] = useState(STREAM_PROMPT);
  const [liveText, setLiveText] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const streamAbort = useRef<AbortController | null>(null);

  useEffect(() => () => streamAbort.current?.abort(), []);

  const streamReply = () =>
    run('stream', async () => {
      setLiveText(null);
      const reply = await generateAsync(input, {
        onUpdate: ({ text }) => setLiveText(text),
      });
      return describeGeneration(reply);
    });

  const createSession = () => {
    setLiveText(null);
    return run('session', async () => describeSession(await create()));
  };

  const streamFromSession = () =>
    run('stream-session', async () => {
      if (!session) throw new Error('Create a session first.');
      setLiveText(null);
      setStopping(false);
      const controller = new AbortController();
      streamAbort.current = controller;
      let text = '';
      try {
        for await (const event of session.generateStream(input, { signal: controller.signal })) {
          if (event.type === 'text') {
            text = event.text;
            setLiveText(text);
          }
          if (event.type === 'result') return describeGeneration(event.result);
        }
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      } finally {
        streamAbort.current = null;
      }
      return text ? { body: text, meta: 'Stopped streaming.' } : { body: 'Stopped streaming.' };
    });

  const stopStreaming = () => {
    setStopping(true);
    streamAbort.current?.abort();
  };

  const liveOutcome =
    (pending === 'stream' || pending === 'stream-session') && liveText !== null
      ? { title: ACTION_TITLES[pending], content: { body: liveText } }
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedTextInput
        style={styles.promptInput}
        placeholder="Prompt"
        multiline
        value={input}
        onChangeText={setInput}
      />

      <BodyText color="secondary" style={styles.description}>
        Each update carries the whole reply so far, so the screen replaces the text instead of
        appending to it.
      </BodyText>

      <Button
        {...buttonProps('stream', !input.trim())}
        onPress={streamReply}
        title="Stream a reply"
      />

      <BodyText color="secondary" style={styles.description}>
        A session streams the same updates as events, and aborting the request's signal stops it.
      </BodyText>

      <StatusRow
        tone={session ? 'success' : 'tertiary'}
        label={session ? 'Session ready' : 'No session'}
      />

      <Button {...buttonProps('session')} onPress={createSession} title="Create session" />
      {pending === 'stream-session' ? (
        <Button
          {...buttonLayout}
          disabled={stopping}
          onPress={stopStreaming}
          title={stopping ? 'Stopping…' : 'Stop streaming'}
        />
      ) : (
        <Button
          {...buttonProps('stream-session', !session || !input.trim())}
          onPress={streamFromSession}
          title="Stream from the session"
        />
      )}

      <AIResultPanel
        outcome={liveOutcome ?? outcome}
        dimmed={pending !== null && !liveOutcome}
        pending={pending !== null}
      />
    </ScrollView>
  );
}
