import { useTheme, type ThemeType } from 'ThemeProvider';
import {
  createSessionAsync,
  LanguageModelError,
  type GenerationResult,
  type LanguageModelSession,
} from 'expo-ai';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BodyText } from '../../components/BodyText';
import MonoText from '../../components/MonoText';

export const SOURCE_TEXT =
  'Our checkout page started timing out yesterday afternoon. Customers watch a spinner for about thirty seconds and then get an error. It only happens on phones, and only for carts with more than five items.';

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

export const ACTION_TITLES: Record<Action, string> = {
  availability: 'getAvailabilityAsync',
  prepare: 'prepareAsync({ allowDownload: true })',
  'prepare-offline': 'prepareAsync({ allowDownload: false })',
  generate: 'generateAsync',
  summarize: 'summarizeAsync',
  categorize: 'categorizeAsync',
  structured: 'generateAsync({ schema })',
  session: 'createSessionAsync',
  turns: 'session.generateAsync',
  stream: 'generateAsync({ onUpdate })',
  'stream-session': 'session.generateStream',
};

export type ErrorReport = { code: string | null; message: string };

/** What a call returned. `mono` renders the body as code instead of prose. */
export type ResultContent = { body: string; mono?: boolean; meta?: string };

export type Outcome = { title: string } & ({ content: ResultContent } | { error: ErrorReport });

export type StatusTone = keyof ThemeType['icon'];

export const formatNullable = (value: string | number | null) =>
  value === null ? 'null' : String(value);

export function describeGeneration({
  value,
  provider,
  model,
  format,
  usage,
}: GenerationResult<unknown>): ResultContent {
  const meta = [
    `provider: ${provider} · model: ${formatNullable(model)} · format: ${format}`,
    `inputTokens: ${formatNullable(usage.inputTokens)} · outputTokens: ${formatNullable(usage.outputTokens)}`,
  ].join('\n');
  return typeof value === 'string'
    ? { body: value, meta }
    : { body: JSON.stringify(value, null, 2), mono: true, meta };
}

export function describeSession({ capabilities }: LanguageModelSession): ResultContent {
  return {
    body: 'Session created.',
    meta: [
      `provider: ${capabilities.provider} · model: ${formatNullable(capabilities.model)}`,
      `contextTokens: ${formatNullable(capabilities.contextTokens)}`,
    ].join('\n'),
  };
}

function toErrorReport(cause: unknown): ErrorReport {
  if (cause instanceof LanguageModelError) {
    return { code: cause.code, message: cause.message };
  }
  return { code: null, message: cause instanceof Error ? cause.message : String(cause) };
}

/** Runs one demo call at a time and owns the outcome shown in the result panel of a screen. */
export function useAIAction() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = async (action: Action, task: () => Promise<ResultContent>) => {
    const title = ACTION_TITLES[action];
    setPending(action);
    try {
      const content = await task();
      if (isMounted.current) setOutcome({ title, content });
    } catch (cause) {
      if (isMounted.current) setOutcome({ title, error: toErrorReport(cause) });
    }
    if (isMounted.current) setPending(null);
  };

  const showResult = (title: string, body: string) => setOutcome({ title, content: { body } });

  const buttonProps = (action: Action, blocked = false) => ({
    ...buttonLayout,
    loading: pending === action,
    disabled: blocked || (pending !== null && pending !== action),
  });

  return { outcome, pending, run, showResult, buttonProps };
}

/** Holds one session and disposes it when it is replaced, disposed, or the screen unmounts. */
export function useSession(instructions?: string) {
  const [session, setSession] = useState<LanguageModelSession | null>(null);
  // A ref, not the state: the state may not commit before an unmount, which would leak the session.
  const latest = useRef<LanguageModelSession | null>(null);
  const isMounted = useRef(false);

  const replace = (next: LanguageModelSession | null) => {
    latest.current?.dispose();
    latest.current = next;
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      replace(null);
    };
  }, []);

  const create = async () => {
    const created = await createSessionAsync({ instructions });
    if (isMounted.current) {
      replace(created);
      setSession(created);
    } else {
      created.dispose();
    }
    return created;
  };

  const dispose = () => {
    replace(null);
    setSession(null);
  };

  return { session, create, dispose };
}

/**
 * Always mounted, so the screen does not jump; a running call dims the previous outcome.
 * While `pending`, the panel never shrinks, so a shorter new outcome cannot move the scroll position.
 */
export function AIResultPanel({
  outcome,
  dimmed,
  pending = dimmed,
}: {
  outcome: Outcome | null;
  dimmed: boolean;
  pending?: boolean;
}) {
  const { theme } = useTheme();
  const [height, setHeight] = useState(0);
  const failed = outcome !== null && 'error' in outcome;

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[
        styles.panel,
        failed
          ? { backgroundColor: theme.background.danger, borderColor: theme.border.danger }
          : { backgroundColor: theme.background.subtle, borderColor: theme.border.default },
        pending && { minHeight: height },
        dimmed && styles.dimmed,
      ]}>
      {outcome === null ? (
        <BodyText color="tertiary">Press a button to run.</BodyText>
      ) : (
        <>
          <BodyText style={styles.panelTitle}>{outcome.title}</BodyText>
          {'error' in outcome ? (
            <>
              <BodyText color="danger" style={styles.errorLabel}>
                {outcome.error.code === null
                  ? 'Error'
                  : `LanguageModelError: ${outcome.error.code}`}
              </BodyText>
              <BodyText color="danger" style={styles.prose}>
                {outcome.error.message}
              </BodyText>
            </>
          ) : (
            <>
              {outcome.content.mono ? (
                <MonoText
                  containerStyle={styles.bareMono}
                  textStyle={{ ...styles.monoText, color: theme.text.default }}>
                  {outcome.content.body}
                </MonoText>
              ) : (
                <BodyText style={styles.prose}>{outcome.content.body}</BodyText>
              )}
              {outcome.content.meta && (
                <BodyText color="secondary" style={styles.meta}>
                  {outcome.content.meta}
                </BodyText>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

/** A literal value that a call receives, such as a prompt or a schema. */
export function InputBlock({ label, children }: { label: string; children: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.inputBlock}>
      <BodyText color="secondary" style={styles.caption}>
        {label}
      </BodyText>
      <MonoText
        containerStyle={{
          ...styles.boxedMono,
          backgroundColor: theme.background.subtle,
          borderColor: theme.border.default,
        }}
        textStyle={{ ...styles.monoText, color: theme.text.default }}>
        {children}
      </MonoText>
    </View>
  );
}

export function StatusRow({ tone, label }: { tone: StatusTone; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: theme.icon[tone] }]} />
      <BodyText>{label}</BodyText>
    </View>
  );
}

export function ThemedTextInput({ style, ...props }: TextInputProps) {
  const { theme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.text.quaternary}
      {...props}
      style={[
        styles.input,
        { color: theme.text.default, borderColor: theme.border.default },
        style,
      ]}
    />
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
    marginBottom: 12,
  },
  buttonFill: {
    alignSelf: 'stretch',
    minHeight: 36,
  },
  input: {
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderRadius: 3,
  },
  promptInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  panel: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dimmed: {
    opacity: 0.4,
  },
  panelTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  prose: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  monoText: {
    fontSize: 12,
  },
  bareMono: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginVertical: 0,
  },
  boxedMono: {
    marginVertical: 0,
    padding: 8,
    borderRadius: 3,
  },
  inputBlock: {
    marginBottom: 12,
  },
  caption: {
    fontSize: 12,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
});

export const buttonLayout = { style: styles.button, buttonStyle: styles.buttonFill };
