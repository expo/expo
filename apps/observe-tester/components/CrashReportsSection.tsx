import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { CRASH_TRIGGERS } from '@/components/crashTriggers';
import CrashTester from '@/modules/crash-tester';
import { useTheme } from '@/utils/theme';

export function CrashReportsSection() {
  const theme = useTheme();

  if (CrashTester == null) {
    return null;
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Crash reports</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Trigger real crashes to produce crash diagnostics.
      </Text>
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
