import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RETRY_COUNT = 5;
const HOSTNAME = 'UPDATES_HOST';
const PORT = 'UPDATES_PORT';

async function sendLog(obj: { logEntries: Updates.UpdatesLogEntry[] }) {
  const logUrl = `http://${HOSTNAME}:${PORT}/log`;
  await fetch(logUrl, {
    method: 'POST',
    body: JSON.stringify(obj),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function readLogs() {
  try {
    const logEntries = await Updates.readLogEntriesAsync(60000);
    await sendLog({
      logEntries,
    });
  } catch (e: any) {
    console.warn(`Error in reading log entries: ${e.message}`);
  }
}

export default function App() {
  useEffect(() => {
    const fetchResponseAsync = async () => {
      for (let i = 0; i < RETRY_COUNT; i++) {
        try {
          const response = await fetch(
            `http://${HOSTNAME}:${PORT}/notify/test`,
          );
          if (response.status === 200) {
            break;
          }
        } catch {
          // do nothing; expected if the server isn't running yet
        }
        // wait 50 ms and then try again
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await readLogs();
    };
    fetchResponseAsync().catch((e) =>
      console.warn(`Error in fetching response: ${e.message}`),
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
