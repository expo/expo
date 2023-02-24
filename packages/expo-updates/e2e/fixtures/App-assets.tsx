import { Inter_900Black } from '@expo-google-fonts/inter';
import { NativeModulesProxy } from 'expo-modules-core';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RETRY_COUNT = 5;
const HOSTNAME = 'UPDATES_HOST';
const PORT = 'UPDATES_PORT';

require('./test.png');
Inter_900Black;

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

async function fetchWithRetry(url: RequestInfo, body: string | undefined = undefined) {
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        body,
        headers: body
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
      });
      if (response.status === 200) {
        return response;
      }
    } catch {
      // do nothing; expected if the server isn't running yet
    }
    // wait 50 ms and then try again
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.error(`Failed to fetch URL ${url}`);
  return null;
}

async function readExpoInternal() {
  try {
    const numFiles = await NativeModulesProxy.ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
    await fetchWithRetry(
      `http://${HOSTNAME}:${PORT}/post`,
      JSON.stringify({
        command: 'readExpoInternal',
        success: true,
        updateId: Updates.updateId,
        numFiles,
      })
    );
  } catch (e: any) {
    await fetchWithRetry(
      `http://${HOSTNAME}:${PORT}/post`,
      JSON.stringify({
        command: 'readExpoInternal',
        success: false,
        updateId: Updates.updateId,
        error: e.message,
      })
    );
  }
}

async function clearExpoInternal() {
  try {
    const numFilesBefore =
      await NativeModulesProxy.ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
    await NativeModulesProxy.ExpoUpdatesE2ETest.clearInternalAssetsFolderAsync();
    const numFilesAfter =
      await NativeModulesProxy.ExpoUpdatesE2ETest.readInternalAssetsFolderAsync();
    await fetchWithRetry(
      `http://${HOSTNAME}:${PORT}/post`,
      JSON.stringify({
        command: 'clearExpoInternal',
        success: true,
        updateId: Updates.updateId,
        numFilesBefore,
        numFilesAfter,
      })
    );
  } catch (e: any) {
    await fetchWithRetry(
      `http://${HOSTNAME}:${PORT}/post`,
      JSON.stringify({
        command: 'clearExpoInternal',
        success: false,
        updateId: Updates.updateId,
        error: e.message,
      })
    );
  }
}

export default function App() {
  useEffect(() => {
    const fetchResponseAsync = async () => {
      const response = await fetchWithRetry(`http://${HOSTNAME}:${PORT}/notify/test`);
      const responseObj = (await response?.json()) || null;
      if (responseObj && responseObj.command) {
        switch (responseObj.command) {
          case 'readExpoInternal':
            await readExpoInternal();
            break;
          case 'clearExpoInternal':
            await clearExpoInternal();
            break;
        }
      }
      await readLogs();
    };
    fetchResponseAsync().catch((e: any) => {
      console.warn(`Error in fetching response: ${e.message}`);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>Notify resource = /notify/test</Text>
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
