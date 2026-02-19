import { Paths, File } from 'expo-file-system';
import type { DownloadProgress } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, View, Text, DimensionValue } from 'react-native';

import HeadingText from '../components/HeadingText';
FileSystemScreen.navigationOptions = {
  title: 'FileSystem',
};

function formatBytes(bytes: number): string {
  if (bytes < 0) return 'unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function DownloadTest() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'cancelled' | 'error'>(
    'idle'
  );
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const startDownload = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('downloading');
    setProgress(null);
    setError(null);
    setResultUri(null);

    const dest = new File(Paths.cache, 'large-download-test.bin');
    if (dest.exists) {
      dest.delete();
    }

    try {
      // ~100 MB test file
      const file = await File.downloadFileAsync('https://proof.ovh.net/files/100Mb.dat', dest, {
        idempotent: true,
        signal: controller.signal,
        onProgress: (data: DownloadProgress) => {
          setProgress({ ...data });
        },
      });
      setResultUri(file.uri);
      setStatus('done');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setStatus('cancelled');
      } else {
        setError(e.message ?? String(e));
        setStatus('error');
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const abort = () => {
    controllerRef.current?.abort();
  };

  const cleanup = () => {
    const dest = new File(Paths.cache, 'large-download-test.bin');
    if (dest.exists) {
      dest.delete();
    }
    setStatus('idle');
    setProgress(null);
    setError(null);
    setResultUri(null);
  };

  const pct =
    progress && progress.totalBytes > 0
      ? ((progress.bytesWritten / progress.totalBytes) * 100).toFixed(1)
      : null;

  return (
    <View>
      <HeadingText>Large file download (100 MB)</HeadingText>

      {status === 'idle' && <Button title="Start download" onPress={startDownload} />}

      {status === 'downloading' && (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFg,
                  { width: (pct ? `${pct}%` : '0%') as DimensionValue },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress
                ? `${formatBytes(progress.bytesWritten)} / ${formatBytes(progress.totalBytes)}${pct ? ` (${pct}%)` : ''}`
                : 'Starting...'}
            </Text>
          </View>
          <Button title="Abort download" color="#cc0000" onPress={abort} />
        </>
      )}

      {status === 'done' && (
        <>
          <Text style={styles.successText}>Download complete</Text>
          <Text style={styles.uriText}>{resultUri}</Text>
          <Button title="Clean up & reset" onPress={cleanup} />
        </>
      )}

      {status === 'cancelled' && (
        <>
          <Text style={styles.cancelledText}>Download cancelled</Text>
          <Button title="Clean up & reset" onPress={cleanup} />
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button title="Clean up & reset" onPress={cleanup} />
        </>
      )}
    </View>
  );
}

export default function FileSystemScreen() {
  return (
    <ScrollView>
      <View style={styles.container}>
        <HeadingText>.contentUri property</HeadingText>
        <Button
          title="From file"
          onPress={async () => {
            const file = new File(Paths.cache, 'file.txt');
            file.write('123');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'text/plain',
            });
          }}
        />
        <Text>Open .pem certificate from BareExpo (should show modal that it's not possible)</Text>
        <Button
          title="From asset"
          onPress={async () => {
            const file = new File(Paths.bundle, 'expo-root.pem');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'application/x-pem-file',
            });
          }}
        />
        <Button
          title="From SAF"
          onPress={async () => {
            const res = await File.pickFileAsync();
            const file = Array.isArray(res) ? res[0] : res;
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: file.type,
            });
          }}
        />

        <DownloadTest />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageBox: {
    padding: 10,
    borderWidth: 1,
  },
  picker: {
    borderWidth: 1,
    padding: 0,
    margin: 0,
  },
  container: {
    padding: 10,
    gap: 10,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBarBg: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  cancelledText: {
    color: '#f57c00',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  errorText: {
    color: '#c62828',
    marginVertical: 4,
  },
  uriText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
});
