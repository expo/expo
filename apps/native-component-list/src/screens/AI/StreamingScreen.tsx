import { generateAsync } from 'expo-ai';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import MonoText from '../../components/MonoText';
import Colors from '../../constants/Colors';
import {
  AIResultPanel,
  describeGeneration,
  SOURCE_TEXT,
  styles,
  useAIAction,
  useIsMounted,
  useModelSession,
} from './shared';

/** Tracks enough to prove that every text snapshot carried the whole reply so far. */
type StreamReport = {
  snapshots: number;
  latestChars: number;
  /** null until a second snapshot exists to compare against. */
  cumulative: boolean | null;
  /** A stop only takes effect at the next event, so asking and stopping are separate states. */
  stopRequested: boolean;
  finished: 'result' | 'stopped' | 'failed' | null;
};

const NO_SNAPSHOTS: StreamReport = {
  snapshots: 0,
  latestChars: 0,
  cumulative: null,
  stopRequested: false,
  finished: null,
};

function withSnapshot(base: StreamReport, text: string, previous: string): StreamReport {
  return {
    ...base,
    snapshots: base.snapshots + 1,
    latestChars: text.length,
    cumulative:
      base.snapshots === 0 ? null : base.cumulative !== false && text.startsWith(previous),
  };
}

function describeEnding(finished: StreamReport['finished'], stopRequested: boolean): string[] {
  switch (finished) {
    case 'result':
      return [
        'The stream ended with the final result shown above.',
        ...(stopRequested ? ['The stop arrived after that result and changed nothing.'] : []),
      ];
    case 'stopped':
      return ['Breaking iteration stopped the stream before a result arrived.'];
    case 'failed':
      return [
        'The stream threw, and the error is shown above.',
        'Any preview above is what had arrived before the failure.',
        ...(stopRequested ? ['The stop never took effect, because the stream failed first.'] : []),
      ];
    default:
      return stopRequested
        ? [
            'A stop is pending and takes effect at the next event.',
            'If the provider sends none, the stream stays open.',
          ]
        : ['The stream is still running.'];
  }
}

function describeStream({
  snapshots,
  latestChars,
  cumulative,
  stopRequested,
  finished,
}: StreamReport): string {
  const ending = describeEnding(finished, stopRequested);
  if (snapshots === 0) {
    return ['snapshots: 0', 'No text snapshot arrived during this attempt.', ...ending].join('\n');
  }
  const shape =
    cumulative !== null
      ? cumulative
        ? ['Every snapshot began with the one before it, so replacing the preview is correct.']
        : [
            'A snapshot did not begin with the one before it.',
            'That breaks the documented contract: these are deltas, not cumulative snapshots.',
          ]
      : finished === null
        ? ['One snapshot has nothing to compare against, so this is not decidable yet.']
        : ['The stream ended after one snapshot, so it never became decidable.'];
  return [
    `snapshots: ${snapshots}`,
    `latest snapshot: ${latestChars} characters`,
    `cumulative: ${cumulative === null ? 'null' : cumulative}`,
    ...shape,
    ...ending,
  ].join('\n');
}

export default function StreamingScreen() {
  const { result, error, pending, run, buttonProps } = useAIAction();
  const { session, createSession } = useModelSession(run);
  const [input, setInput] = useState(SOURCE_TEXT);
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<StreamReport | null>(null);
  const isMounted = useIsMounted();
  // Nothing in this flow takes an abort signal: breaking iteration is the cancel. The ticket asks
  // the running loop to break, and tells a late callback that its report has been retired.
  const streamTicket = useRef(0);

  useEffect(
    () => () => {
      // The session a stream reads from is disposed on unmount, so a running loop has to be
      // retired here as well; nothing else would break its iteration.
      streamTicket.current += 1;
    },
    []
  );

  // Creating a session is the one action here that does not start a stream, so it has to retire the
  // previous stream's panels itself; every other action goes through beginStream below.
  const openSession = () => {
    setPreview(null);
    setStream(null);
    return createSession();
  };

  const beginStream = () => {
    setPreview(null);
    setStream(NO_SNAPSHOTS);
    return ++streamTicket.current;
  };

  const recordSnapshot = (text: string, previous: string) => {
    setStream((base) => withSnapshot(base ?? NO_SNAPSHOTS, text, previous));
    setPreview(text);
  };

  // The first ending to land wins: a stop must not overwrite a result that already arrived, and a
  // failure while unwinding a stop must not overwrite the stop it was unwinding.
  const finishStream = (finished: NonNullable<StreamReport['finished']>) =>
    setStream((base) => {
      const report = base ?? NO_SNAPSHOTS;
      return report.finished === null ? { ...report, finished } : report;
    });

  const streamReply = () =>
    run('stream', async () => {
      const ticket = beginStream();
      let previous = '';
      try {
        const result = await generateAsync(input, {
          onUpdate: ({ text }) => {
            if (streamTicket.current !== ticket) return;
            recordSnapshot(text, previous);
            previous = text;
          },
        });
        finishStream('result');
        return describeGeneration(result);
      } catch (cause) {
        finishStream('failed');
        throw cause;
      }
    });

  const streamFromSession = () =>
    run('stream-session', async () => {
      if (!session) throw new Error('Create a session first.');
      const ticket = beginStream();
      let previous = '';
      try {
        for await (const event of session.generateStream(input)) {
          // A result that already arrived outranks a pending stop; dropping it would lose work the
          // model has finished.
          if (event.type === 'result') {
            finishStream('result');
            return describeGeneration(event.result);
          }
          if (streamTicket.current !== ticket) {
            if (isMounted.current) finishStream('stopped');
            return 'Stopped. Breaking out of the loop aborted the generation.';
          }
          if (event.type === 'text') {
            recordSnapshot(event.text, previous);
            previous = event.text;
          }
        }
        throw new Error(
          'The stream ended without a result event, so the provider closed it early. ' +
            'Check the device log for a provider failure, then try again.'
        );
      } catch (cause) {
        finishStream('failed');
        throw cause;
      }
    });

  const stopStreaming = () => {
    streamTicket.current += 1;
    setStream((base) => ({ ...(base ?? NO_SNAPSHOTS), stopRequested: true }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AIResultPanel result={result} error={error} />

      <BodyText color="secondary" style={styles.description}>
        Both calls on this screen stream the text you enter below. Every text event carries the
        whole reply so far rather than the new piece, so the preview replaces the previous snapshot
        instead of appending to it. The library also drops adjacent snapshots that the screen never
        read, so a fast model can finish in only a handful of them.
      </BodyText>

      <TextInput
        style={styles.textInput}
        placeholder="Prompt or source text"
        placeholderTextColor={Colors.secondaryText}
        multiline
        value={input}
        onChangeText={setInput}
      />

      <Button
        {...buttonProps('stream', !input.trim())}
        onPress={streamReply}
        title="Stream a reply"
      />

      <BodyText color="secondary" style={styles.description}>
        {session ? 'A session is open.' : 'No session is open.'}
      </BodyText>

      <Button {...buttonProps('session')} onPress={openSession} title="Create session" />

      <BodyText color="secondary" style={styles.description}>
        The session form streams through the session above, which keeps every turn you stream into
        it. Stopping it means breaking out of the for-await loop, which aborts the generation at the
        next event. Stop applies to this form only: a one-shot call cannot be aborted, and throwing
        from its onUpdate raises ERR_UPDATE_FAILED instead of cancelling.
      </BodyText>

      <Button
        {...buttonProps('stream-session', !session || !input.trim())}
        onPress={streamFromSession}
        title="Stream from the session"
      />
      <Button
        style={styles.button}
        disabled={pending !== 'stream-session'}
        onPress={stopStreaming}
        title="Stop streaming"
      />

      {preview !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Latest snapshot:</Text>
          <MonoText containerStyle={styles.resultText}>{preview}</MonoText>
        </View>
      )}

      <BodyText color="secondary" style={styles.description}>
        The report below separates a stream that is still running from one that ended with a final
        result, one that a stop broke off, and one that threw. It also checks each snapshot against
        its predecessor; the first snapshot can decide nothing, because every string starts with an
        empty one.
      </BodyText>

      {stream && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Stream report:</Text>
          <MonoText containerStyle={styles.resultText}>{describeStream(stream)}</MonoText>
        </View>
      )}
    </ScrollView>
  );
}
