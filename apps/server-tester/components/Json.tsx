import { StyleSheet, Text } from 'react-native';

import { colors, monospaceFontFamily } from './theme';

interface JsonProps {
  value: unknown;
  testID?: string;
}

export function Json({ value, testID }: JsonProps) {
  return (
    <Text testID={testID} style={styles.json}>
      {JSON.stringify(value, null, 2)}
    </Text>
  );
}

const styles = StyleSheet.create({
  json: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: monospaceFontFamily,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'left',
    flexShrink: 1,
    maxWidth: 800,
  },
});
