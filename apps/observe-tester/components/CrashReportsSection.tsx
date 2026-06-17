import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import CrashTester, { type CrashKind } from '@/modules/crash-tester';
import { useTheme } from '@/utils/theme';

const CRASH_TRIGGERS: { kind: CrashKind; title: string; description: string }[] = [
  { kind: 'badAccess', title: 'Bad access', description: 'EXC_BAD_ACCESS / SIGSEGV' },
  { kind: 'fatalError', title: 'Fatal error', description: 'EXC_CRASH / SIGABRT' },
  { kind: 'divideByZero', title: 'Divide by zero', description: 'EXC_ARITHMETIC / SIGFPE' },
  { kind: 'forceUnwrapNil', title: 'Force-unwrap nil', description: 'EXC_BAD_INSTRUCTION' },
  { kind: 'arrayOutOfBounds', title: 'Array out of bounds', description: 'EXC_BAD_INSTRUCTION' },
  { kind: 'objcException', title: 'NSException', description: 'Uncaught Objective-C exception' },
  { kind: 'stackOverflow', title: 'Stack overflow', description: 'Unbounded recursion' },
];

// Throws from a timer callback so the error is genuinely uncaught: it unwinds to React Native's
// global error handler (where expo-app-metrics' handler is chained) instead of being swallowed by
// the press handler or a React error boundary.
function triggerUncaughtError() {
  setTimeout(() => {
    throw new Error('Intentional uncaught JS error from observe-tester');
  }, 0);
}

export function CrashReportsSection() {
  const theme = useTheme();

  if (CrashTester == null) {
    return null;
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash reports</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Trigger real crashes to produce crash diagnostics, or throw an uncaught JS error to exercise
        the JavaScript error handler.
      </Text>
      <Button
        title="Throw JS error"
        description="Uncaught JS error captured by the global handler (RedBox in dev)"
        onPress={triggerUncaughtError}
        theme="secondary"
      />
      {CRASH_TRIGGERS.map(({ kind, title, description }) => (
        <Button
          key={kind}
          title={title}
          description={description}
          onPress={() => CrashTester?.triggerCrash(kind)}
          theme="secondary"
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
});
