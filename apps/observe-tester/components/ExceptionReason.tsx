import type { CrashReport } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// Default fallback (e.g. web): crash reports only carry an exception reason on native.
export function ExceptionReason(_props: { reason: NonNullable<CrashReport['exceptionReason']> }) {
  const theme = useTheme();
  return (
    <Text style={[styles.message, { color: theme.text.secondary }]}>
      Exception details aren&apos;t available on this platform.
    </Text>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 13,
  },
});
