import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { runRuntimeChecks, type RuntimeChecks } from '../modules/ui-runtime';

export default function UIRuntimeScreen() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RuntimeChecks>();
  const [error, setError] = useState<string>();

  async function run() {
    setRunning(true);
    setResult(undefined);
    setError(undefined);
    try {
      setResult(await runRuntimeChecks());
    } catch (error) {
      setError(String(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'UI runtime primitive' }} />
      <Text style={styles.title}>Step 1: runtime ownership</Text>
      <Text>
        A separate Hermes engine. JavaScript executes on the UI thread; objects and globals stay
        inside that engine. No React renderer, Fabric surface, list, or scheduler yet.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={running || Platform.OS !== 'ios'}
        onPress={run}
        style={styles.button}>
        <Text style={styles.buttonText}>{running ? 'Running checks…' : 'Run runtime checks'}</Text>
      </Pressable>
      {Platform.OS !== 'ios' && <Text>This first step is iOS-only.</Text>}
      {error && <Text selectable>{error}</Text>}
      {result && (
        <>
          <Text style={styles.title}>All runtime checks passed</Text>
          {Object.entries(result).map(([name, passed]) => (
            <Text key={name}>
              {name}: {passed ? 'PASS' : 'FAIL'}
            </Text>
          ))}
        </>
      )}
      <Text>
        The button's Promise is asynchronous. Inside the native test, evaluation is synchronous on
        the UI thread. This checks ownership and isolation, not frame rate or React rendering.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  button: { padding: 14, borderRadius: 8, backgroundColor: '#175432' },
  buttonText: { color: 'white', fontWeight: '700' },
});
