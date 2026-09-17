import {
  categorizeAsync,
  createSessionAsync,
  generateAsync,
  getAvailabilityAsync,
  LanguageModelError,
  prepareAsync,
  schema,
  summarizeAsync,
  type GenerationResult,
  type LanguageModelSession,
  type ModelAvailability,
} from 'expo-ai';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BodyText } from '../components/BodyText';
import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

const SOURCE_TEXT =
  'Our checkout page started timing out yesterday afternoon. Customers watch a spinner for about thirty seconds and then get an error. It only happens on phones, and only for carts with more than five items.';

const TICKET_CATEGORIES = ['bug report', 'billing question', 'feature request', 'praise'] as const;

const TRIP_PROMPT = 'Plan a three day trip to Kyoto in April.';

const TRIP_SCHEMA = schema.object({
  city: schema.string({ description: 'The city the plan is for' }),
  days: schema.integer({ description: 'How many days the plan covers', minimum: 1, maximum: 5 }),
  season: schema.enum(['spring', 'summer', 'autumn', 'winter']),
  highlights: schema.array(schema.string({ description: 'One place to visit' }), { maxItems: 3 }),
  rainGearAdvised: schema.optional(schema.boolean()),
});

const SESSION_INSTRUCTIONS = 'You are terse. Answer in one short sentence.';
const FIRST_TURN = 'My favourite colour is teal. Acknowledge it.';
const SECOND_TURN = 'Which colour did I name? Answer with the colour only.';

type Action =
  | 'availability'
  | 'prepare'
  | 'prepare-offline'
  | 'generate'
  | 'summarize'
  | 'categorize'
  | 'structured'
  | 'session'
  | 'turns'
  | 'stream'
  | 'stream-session';

type ErrorReport = { code: string | null; message: string };

/** Tracks enough to tell "onProgress never ran" apart from "onProgress reported null". */
type ProgressReport = { calls: number; last: { value: number | null; at: number } | null };

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

const formatNullable = (value: string | number | null) => (value === null ? 'null' : String(value));

function describeAvailability(availability: ModelAvailability): string {
  switch (availability.status) {
    case 'available': {
      const { capabilities } = availability;
      return [
        'status: available',
        `provider: ${capabilities.provider}`,
        `model: ${formatNullable(capabilities.model)}`,
        `execution: ${capabilities.execution}`,
        `constrainedOutput: ${capabilities.constrainedOutput}`,
        `runtimeToolDeclarations: ${capabilities.runtimeToolDeclarations}`,
        `images: ${capabilities.images}`,
        `imageTools: ${capabilities.imageTools ?? 'not reported by this provider'}`,
        `contextTokens: ${formatNullable(capabilities.contextTokens)}`,
      ].join('\n');
    }
    case 'unavailable':
      return `status: unavailable\nreason: ${availability.reason}`;
    default:
      return `status: ${availability.status}\nprogress: ${formatNullable(availability.progress)}`;
  }
}

function describeProgress({ calls, last }: ProgressReport): string {
  if (!last) {
    return 'onProgress calls: 0\nThe callback never ran during this attempt.';
  }
  return [
    `onProgress calls: ${calls}`,
    `last raw value: ${formatNullable(last.value)}`,
    last.value === null
      ? 'The provider reported no percentage for that call.'
      : `That is ${Math.round(last.value * 100)}% of the download.`,
    `last call: #${calls} at ${new Date(last.at).toISOString().slice(11, 23)} UTC`,
  ].join('\n');
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

function describeGeneration({
  value,
  provider,
  model,
  format,
  usage,
}: GenerationResult<unknown>): string {
  return [
    typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    '',
    `provider: ${provider} · model: ${formatNullable(model)} · format: ${format}`,
    `inputTokens: ${formatNullable(usage.inputTokens)} · outputTokens: ${formatNullable(usage.outputTokens)}`,
  ].join('\n');
}

function toErrorReport(cause: unknown): ErrorReport {
  if (cause instanceof LanguageModelError) {
    return { code: cause.code, message: cause.message };
  }
  return { code: null, message: cause instanceof Error ? cause.message : String(cause) };
}

export default function AIScreen() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<ErrorReport | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [session, setSession] = useState<LanguageModelSession | null>(null);
  const [input, setInput] = useState(SOURCE_TEXT);
  const [preview, setPreview] = useState<string | null>(null);
  const [stream, setStream] = useState<StreamReport | null>(null);
  const isMounted = useRef(true);
  // Nothing in this flow takes an abort signal: breaking iteration is the cancel. The ticket asks
  // the running loop to break, and tells a late callback that its report has been retired.
  const streamTicket = useRef(0);

  // Replacing the session, or leaving the screen, has to release the native session it holds.
  useEffect(() => () => session?.dispose(), [session]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // The session a stream reads from is disposed on unmount, so a running loop has to be
      // retired here as well; nothing else would break its iteration.
      streamTicket.current += 1;
    };
  }, []);

  const run = async (action: Action, task: () => Promise<string>) => {
    setPending(action);
    setError(null);
    setResult(null);
    setPreview(null);
    setStream(null);
    try {
      setResult(await task());
    } catch (cause) {
      setError(toErrorReport(cause));
    } finally {
      setPending(null);
    }
  };

  const checkAvailability = () =>
    run('availability', async () => describeAvailability(await getAvailabilityAsync()));

  useEffect(() => {
    checkAvailability();
  }, []);

  const prepare = (allowDownload: boolean) =>
    run(allowDownload ? 'prepare' : 'prepare-offline', async () => {
      setProgress({ calls: 0, last: null });
      const availability = await prepareAsync({
        allowDownload,
        onProgress: (value) =>
          setProgress((previous) => ({
            calls: (previous?.calls ?? 0) + 1,
            last: { value, at: Date.now() },
          })),
      });
      return describeAvailability(availability);
    });

  const generate = () =>
    run('generate', async () => describeGeneration(await generateAsync(input)));

  const summarize = () =>
    run('summarize', async () =>
      describeGeneration(await summarizeAsync(input, { length: 'short' }))
    );

  const categorize = () =>
    run('categorize', async () =>
      describeGeneration(await categorizeAsync(input, { categories: TICKET_CATEGORIES }))
    );

  const generateStructured = () =>
    run('structured', async () =>
      describeGeneration(await generateAsync(TRIP_PROMPT, { schema: TRIP_SCHEMA }))
    );

  const createSession = () =>
    run('session', async () => {
      const opened = await createSessionAsync({ instructions: SESSION_INSTRUCTIONS });
      // A session that arrives after unmount never reaches the cleanup above, because React
      // discards the state update that the cleanup reads.
      if (!isMounted.current) {
        opened.dispose();
        return 'Session disposed; the screen was gone before it opened.';
      }
      setSession(opened);
      const { provider, model, contextTokens } = opened.capabilities;
      return [
        'Session created.',
        `provider: ${provider} · model: ${formatNullable(model)}`,
        `contextTokens: ${formatNullable(contextTokens)}`,
      ].join('\n');
    });

  const runSessionTurns = () =>
    run('turns', async () => {
      if (!session) throw new Error('Create a session first.');
      const first = await session.generateAsync(FIRST_TURN);
      const second = await session.generateAsync(SECOND_TURN);
      return [
        `Q: ${FIRST_TURN}`,
        `A: ${first.value}`,
        '',
        `Q: ${SECOND_TURN}`,
        `A: ${second.value}`,
        '',
        'The second answer is only correct if the session kept the first turn.',
      ].join('\n');
    });

  const disposeSession = () => {
    setSession(null);
    setError(null);
    setResult('Session disposed.');
  };

  const beginStream = () => {
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

  const buttonProps = (action: Action, blocked = false) => ({
    loading: pending === action,
    disabled: blocked || (pending !== null && pending !== action),
    style: styles.button,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={styles.heading}>On-device language models</HeadingText>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Result:</Text>
          <MonoText containerStyle={styles.resultText}>{result}</MonoText>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>
            {error.code === null ? 'Error:' : 'LanguageModelError:'}
          </Text>
          {error.code !== null && <Text style={styles.errorCode}>code: {error.code}</Text>}
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      <BodyText color="secondary" style={styles.description}>
        expo-ai runs a system language model on the device: Apple Foundation Models on iOS, ML Kit's
        Gemini Nano on Android, and the browser's Prompt API on web. Each step below is its own
        button, so a failure points at a single call.
      </BodyText>

      <HeadingText style={styles.heading}>Availability</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Reports whether the requested model is ready, and never starts a download. Unsupported
        hardware, Apple Intelligence turned off, a browser without the Prompt API, and a missing
        native module all report status "unavailable" with a reason instead of failing.
      </BodyText>

      <Button
        {...buttonProps('availability')}
        onPress={checkAvailability}
        title="Check availability"
      />

      <HeadingText style={styles.heading}>Preparation</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Preparation is the only step that downloads the model, and the download is large. Android
        needs allowDownload: true and the app in the foreground. Apple manages its model in system
        Settings, so iOS can neither start the download here nor report its progress.
      </BodyText>

      <Button
        {...buttonProps('prepare')}
        onPress={() => prepare(true)}
        title="Prepare and allow download"
      />

      <BodyText color="secondary" style={styles.description}>
        Preparing without a download returns the current availability right away. That early return
        is one of the reasons onProgress can stay at zero calls.
      </BodyText>

      <Button
        {...buttonProps('prepare-offline')}
        onPress={() => prepare(false)}
        title="Prepare without downloading"
      />

      <BodyText color="secondary" style={styles.description}>
        The report below separates three cases that otherwise look identical: onProgress never ran,
        it ran and carried null because the provider does not know the percentage, and it ran with a
        real fraction. Values are printed exactly as they arrive.
      </BodyText>

      {progress && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Preparation progress:</Text>
          <MonoText containerStyle={styles.resultText}>{describeProgress(progress)}</MonoText>
        </View>
      )}

      <HeadingText style={styles.heading}>Text</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        All three calls read the input below, so their results are comparable. generateAsync answers
        it, summarizeAsync condenses it, and categorizeAsync picks one of:{' '}
        {TICKET_CATEGORIES.join(', ')}.
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
        {...buttonProps('generate', !input.trim())}
        onPress={generate}
        title="Generate a reply"
      />
      <Button {...buttonProps('summarize', !input.trim())} onPress={summarize} title="Summarize" />
      <Button
        {...buttonProps('categorize', !input.trim())}
        onPress={categorize}
        title="Categorize"
      />

      <HeadingText style={styles.heading}>Structured output</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        A schema built with the schema helpers constrains the result to an object with a city, a day
        count from 1 to 5, a season, up to three highlights, and an optional rain-gear flag. A
        provider with constrained output decodes the schema directly and reports format:
        constrained, except the browser Prompt API, which cannot apply numeric bounds and so falls
        back for this schema even while it reports constrainedOutput: supported. Without constrained
        output the call falls back to validated prompting, reports format: validated, and rejects
        with ERR_VALIDATION_RETRIES_EXHAUSTED only once the repair attempts run out.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        Prompt: {TRIP_PROMPT}
      </BodyText>

      <Button
        {...buttonProps('structured')}
        onPress={generateStructured}
        title="Generate a trip plan"
      />

      <HeadingText style={styles.heading}>Session</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        A session keeps its turns, so the second question below can only be answered from the first.
        A session holds a native resource, which this screen releases when you replace it, dispose
        it, or leave the screen.
      </BodyText>

      <BodyText color="secondary" style={styles.description}>
        {session ? 'A session is open.' : 'No session is open.'}
      </BodyText>

      <Button {...buttonProps('session')} onPress={createSession} title="Create session" />
      <Button {...buttonProps('turns', !session)} onPress={runSessionTurns} title="Run two turns" />
      <Button
        style={styles.button}
        disabled={!session || pending !== null}
        onPress={disposeSession}
        title="Dispose session"
      />

      <HeadingText style={styles.heading}>Streaming</HeadingText>

      <BodyText color="secondary" style={styles.description}>
        Both calls below stream the input from the Text section. Every text event carries the whole
        reply so far rather than the new piece, so the preview replaces the previous snapshot
        instead of appending to it. The library also drops adjacent snapshots that the screen never
        read, so a fast model can finish in only a handful of them.
      </BodyText>

      <Button
        {...buttonProps('stream', !input.trim())}
        onPress={streamReply}
        title="Stream a reply"
      />

      <BodyText color="secondary" style={styles.description}>
        The session form streams through the session above, so it keeps the earlier turns. Stopping
        it means breaking out of the for-await loop, which aborts the generation at the next event.
        Stop applies to this form only: a one-shot call cannot be aborted, and throwing from its
        onUpdate raises ERR_UPDATE_FAILED instead of cancelling.
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  heading: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    marginBottom: 20,
  },
  textInput: {
    marginBottom: 20,
    padding: 10,
    minHeight: 96,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 3,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.tintColor,
  },
  resultText: {
    fontSize: 12,
    borderWidth: 0,
  },
  errorContainer: {
    backgroundColor: '#ffe8e8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#cc0000',
  },
  errorCode: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#cc0000',
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
  },
});
