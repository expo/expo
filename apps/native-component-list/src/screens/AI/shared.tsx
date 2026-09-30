import {
  createSessionAsync,
  LanguageModelError,
  type GenerationResult,
  type LanguageModelSession,
} from 'expo-ai';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import MonoText from '../../components/MonoText';
import Colors from '../../constants/Colors';

export const SOURCE_TEXT =
  'Our checkout page started timing out yesterday afternoon. Customers watch a spinner for about thirty seconds and then get an error. It only happens on phones, and only for carts with more than five items.';

export const SESSION_INSTRUCTIONS = 'You are terse. Answer in one short sentence.';

export type Action =
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

export type ErrorReport = { code: string | null; message: string };

type RunAction = (action: Action, task: () => Promise<string>) => Promise<void>;

export const formatNullable = (value: string | number | null) =>
  value === null ? 'null' : String(value);

export function describeGeneration({
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

export function useIsMounted() {
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
}

/** Runs one demo call at a time and owns the result and error panels of a screen. */
export function useAIAction() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<ErrorReport | null>(null);
  const [pending, setPending] = useState<Action | null>(null);

  const run: RunAction = async (action, task) => {
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

  const showResult = (text: string) => {
    setError(null);
    setResult(text);
  };

  const buttonProps = (action: Action, blocked = false) => ({
    loading: pending === action,
    disabled: blocked || (pending !== null && pending !== action),
    style: styles.button,
  });

  return { result, error, pending, run, showResult, buttonProps };
}

/** Opens a session that lives as long as the screen that asked for it. */
export function useModelSession(run: RunAction) {
  const [session, setSession] = useState<LanguageModelSession | null>(null);
  const isMounted = useIsMounted();

  // Replacing the session, or leaving the screen, has to release the native session it holds.
  useEffect(() => () => session?.dispose(), [session]);

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

  return { session, setSession, createSession };
}

export function AIResultPanel({
  result,
  error,
}: {
  result: string | null;
  error: ErrorReport | null;
}) {
  return (
    <>
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
    </>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
