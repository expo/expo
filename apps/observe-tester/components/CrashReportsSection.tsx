import AppMetrics, { type CrashKind } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
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

export function CrashReportsSection() {
  const theme = useTheme();

  if (typeof AppMetrics.triggerCrash !== 'function') {
    return null;
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash reports</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Trigger real crashes to produce MetricKit diagnostics, or simulate a crash report attached
        to the current session.
      </Text>
      <Button
        title="Simulate crash report"
        description="Adds a fake crash report to the current session"
        onPress={() => AppMetrics.simulateCrashReport()}
        theme="secondary"
      />
      {CRASH_TRIGGERS.map(({ kind, title, description }) => (
        <Button
          key={kind}
          title={title}
          description={description}
          onPress={() => AppMetrics.triggerCrash(kind)}
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
