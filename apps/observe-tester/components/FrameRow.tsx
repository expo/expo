import type { CallStackFrame } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// Default fallback (e.g. web): crash reports only carry call stacks on native.
export function FrameRow(_props: { frame: CallStackFrame }) {
  const theme = useTheme();
  return <Text style={[styles.frame, { color: theme.text.secondary }]}>(unsupported)</Text>;
}

const styles = StyleSheet.create({
  frame: {
    fontSize: 11,
    paddingVertical: 2,
  },
});
