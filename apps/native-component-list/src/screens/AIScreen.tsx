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
  | 'turns';

type ErrorReport = { code: string | null; message: string };

/** Tracks enough to tell "onProgress never ran" apart from "onProgress reported null". */
type ProgressReport = { calls: number; last: { value: number | null; at: number } | null };

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
  const isMounted = useRef(true);

  // Replacing the session, or leaving the screen, has to release the native session it holds.
  useEffect(() => () => session?.dispose(), [session]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = async (action: Action, task: () => Promise<string>) => {
    setPending(action);
    setError(null);
    setResult(null);
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
