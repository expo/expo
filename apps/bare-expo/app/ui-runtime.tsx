import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import {
  runQueueChecks,
  runReactChecks,
  runRuntimeChecks,
  type QueueChecks,
  type ReactChecks,
  type RuntimeChecks,
} from '../modules/ui-runtime';

export default function UIRuntimeScreen() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RuntimeChecks>();
  const [error, setError] = useState<string>();
  const [queueResult, setQueueResult] = useState<QueueChecks>();
  const [reactResult, setReactResult] = useState<ReactChecks>();

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

  async function runQueue() {
    setRunning(true);
    setQueueResult(undefined);
    setError(undefined);
    try {
      setQueueResult(await runQueueChecks());
    } catch (error) {
      setError(String(error));
    } finally {
      setRunning(false);
    }
  }

  async function runReact() {
    setRunning(true);
    setReactResult(undefined);
    setError(undefined);
    try {
      setReactResult(await runReactChecks());
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
        inside that engine. This first check does not load React.
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
      <Text style={styles.title}>Step 2: execution queue</Text>
      <Text>
        Run urgent native work immediately, or queue updates in order. Nested immediate calls are
        rejected. Closing cancels pending jobs without interrupting the current job.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={running || Platform.OS !== 'ios'}
        onPress={runQueue}
        style={styles.button}>
        <Text style={styles.buttonText}>Run queue checks</Text>
      </Pressable>
      {queueResult && (
        <>
          <Text style={styles.title}>All queue checks passed</Text>
          {Object.entries(queueResult)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, passed]) => (
              <Text key={name}>
                {name}: {passed ? 'PASS' : 'FAIL'}
              </Text>
            ))}
        </>
      )}
      <Text>
        One deferred job runs per main-queue dispatch. That allows other queued work to interleave;
        it does not guarantee a frame between jobs or make a long job interruptible.
      </Text>
      <Text style={styles.title}>Step 3: React on UI</Text>
      <Text>
        A separate React bundle renders ordinary JSX into an in-memory test tree. Hooks update a
        counter from 0 to 1 synchronously, then to 2 through the UI queue. No Fabric or native views
        yet.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={running || Platform.OS !== 'ios'}
        onPress={runReact}
        style={styles.button}>
        <Text style={styles.buttonText}>Run React checks</Text>
      </Pressable>
      {reactResult && (
        <>
          <Text style={styles.title}>All React checks passed</Text>
          <Text>React {reactResult.reactVersion}: committed counts 0 → 1 → 2, then unmounted.</Text>
          {Object.entries(reactResult.checks)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, passed]) => (
              <Text key={name}>
                {name}: {passed ? 'PASS' : 'FAIL'}
              </Text>
            ))}
        </>
      )}
      {error && <Text selectable>{error}</Text>}
      <Text>
        This screen uses the app's React renderer to display copied test results. The tested
        component, its state, effects, and React scheduler execute in the separate UI-thread Hermes
        runtime.
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
