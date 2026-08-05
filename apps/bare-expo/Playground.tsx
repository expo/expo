import { useTheme } from 'ThemeProvider';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Empty scratch screen for isolating reproductions. Replace the contents with your repro code
// and open it from the Playground tab. Revert your changes before committing unrelated work.
export default function Playground() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background.default }]}>
      <Text style={styles.icon}>🧪</Text>
      <Text style={[styles.title, { color: theme.text.default }]}>Playground</Text>
      <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
        Replace the contents of apps/bare-expo/Playground.tsx with your repro code.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
