import type { CallStackFrame } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// Android frames are JVM stack-trace strings (e.g. `com.example.Foo.bar(Foo.kt:42)`) and carry
// no binary image or address, so we render the symbol on its own.
export function FrameRow({ frame }: { frame: CallStackFrame }) {
  const theme = useTheme();
  return (
    <Text style={[styles.frame, { color: theme.text.default }]}>{frame.symbol ?? '(unknown)'}</Text>
  );
}

const styles = StyleSheet.create({
  frame: {
    fontFamily: 'monospace',
    fontSize: 11,
    paddingVertical: 2,
  },
});
