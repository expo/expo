import { borderRadius, lightTheme, spacing } from '@expo/styleguide-native';
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Json({ json = {} }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{JSON.stringify(json, null, '\t')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.background.tertiary,
    borderRadius: borderRadius.large,
    padding: spacing[4],
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: lightTheme.text.default,
  },
});
