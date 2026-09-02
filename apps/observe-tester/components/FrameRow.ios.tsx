import type { CallStackFrame } from 'expo-app-metrics';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// iOS frames carry a binary image and an address; the symbol is filled in by on-device
// symbolication, falling back to the binary offset when it couldn't be resolved.
export function FrameRow({ frame }: { frame: CallStackFrame }) {
  const theme = useTheme();
  return (
    <Text style={[styles.frame, { color: theme.text.default }]}>
      <Text style={{ color: theme.text.tertiary }}>{formatAddress(frame.address)} </Text>
      <Text style={{ color: theme.text.default }}>{frame.binaryName ?? '(unknown)'}</Text>
      {frame.symbol ? (
        <Text style={{ color: theme.text.default }}> {frame.symbol}</Text>
      ) : (
        <Text style={{ color: theme.text.secondary }}>
          {formatOffset(frame.offsetIntoBinaryTextSegment)}
        </Text>
      )}
    </Text>
  );
}

function formatAddress(address: number | null | undefined) {
  if (address == null) return '0x0000000000000000';
  return '0x' + address.toString(16).padStart(16, '0');
}

function formatOffset(offset: number | null | undefined) {
  if (offset == null) return '';
  return ' +0x' + offset.toString(16);
}

const styles = StyleSheet.create({
  frame: {
    fontFamily: 'Menlo',
    fontSize: 11,
    paddingVertical: 2,
  },
});
