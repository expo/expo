import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { requestCrashOnNextLaunch } from '@/utils/crashOnLaunch';
import { useTheme } from '@/utils/theme';

const REPORTED_LEVELS = new Set(['warn', 'error', 'fatal']);
const ONE_HOUR_MS = 3_600_000;

export default function ExpoUpdatesExample() {
  const theme = useTheme();
  const [status, setStatus] = useState('');
  const [entries, setEntries] = useState<Updates.UpdatesLogEntry[]>([]);

  async function checkForUpdate() {
    try {
      const result = await Updates.checkForUpdateAsync();
      setStatus(`Update available: ${result.isAvailable}`);
    } catch (error) {
      setStatus(`Check failed: ${String(error)}`);
    }
  }

  async function crashOnNextLaunch() {
    try {
      await requestCrashOnNextLaunch();
      setStatus('The app crashes soon after the next launch. Close and open it again.');
    } catch (error) {
      setStatus(`Could not store the flag: ${String(error)}`);
    }
  }

  async function readLog() {
    try {
      const logEntries = await Updates.readLogEntriesAsync(ONE_HOUR_MS);
      setEntries(logEntries.filter((entry) => REPORTED_LEVELS.has(entry.level)).slice(-10));
    } catch (error) {
      setStatus(`Could not read the log: ${String(error)}`);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        The expo-updates integration reports the errors in the expo-updates log as `updates.error`
        errors, and its warnings as `updates.warning` events. It reads the log when the app starts,
        and then reports each new entry when it is logged. A crash that error recovery handled is
        reported as `updates.error_recovery`.
      </Text>
      <Button
        title="Check for update"
        description="Turn off the network first to log an error"
        onPress={checkForUpdate}
      />
      <Button
        title="Crash on next launch"
        description="A JS error soon after launch, which error recovery handles"
        theme="secondary"
        onPress={crashOnNextLaunch}
      />
      <Button
        title="Show recent log entries"
        description="Warnings and errors from the last hour"
        theme="secondary"
        onPress={readLog}
      />
      {status ? <Text style={[styles.status, { color: theme.text.default }]}>{status}</Text> : null}
      {entries.map((entry) => (
        <Text
          key={`${entry.timestamp}|${entry.code}|${entry.message}`}
          style={[styles.entry, { color: theme.text.secondary }]}>
          {`${entry.level} ${entry.code}: ${entry.message}`}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    marginVertical: 12,
  },
  entry: {
    fontSize: 12,
    marginBottom: 8,
  },
});
