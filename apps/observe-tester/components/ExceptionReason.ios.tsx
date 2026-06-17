import type { CrashReport } from 'expo-app-metrics';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

// On iOS the exception reason is MetricKit's structured object (unhandled Objective-C exceptions).
export function ExceptionReason({
  reason,
}: {
  reason: NonNullable<CrashReport['exceptionReason']>;
}) {
  const theme = useTheme();

  // `exceptionReason` can be a plain string; render it as-is rather than reading
  // structured fields off it.
  if (typeof reason === 'string') {
    console.warn('exceptionReason should not be a string on iOS');
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: theme.text.default }]}>{reason.composedMessage}</Text>
      <Text style={[styles.meta, { color: theme.text.secondary }]}>
        {reason.className} · {reason.exceptionType}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
});
