import * as CallbackTest from 'callback-test';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

export default function CallbackScreen() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((previous) => [...previous, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ gap: 10 }}>
      <HeadingText>Callback</HeadingText>

      <HeadingText>Argument types</HeadingText>
      <Button
        title="Call with Int"
        onPress={() => CallbackTest.callWithInt((value) => addLog(`callWithInt: ${value}`))}
      />
      <Button
        title="Call with Record"
        onPress={() =>
          CallbackTest.callWithRecord((progress) =>
            addLog(`callWithRecord: stage=${progress.stage}, percent=${progress.percent}`)
          )
        }
      />
      <Button
        title="Call with Enum"
        onPress={() => CallbackTest.callWithEnum((stage) => addLog(`callWithEnum: ${stage}`))}
      />
      <Button
        title="Greet with Callback"
        onPress={() =>
          CallbackTest.greetWithCallback('Expo', (greeting) =>
            addLog(`greetWithCallback: ${greeting}`)
          )
        }
      />
      <Button
        title="Call with Array"
        onPress={() =>
          CallbackTest.callWithArray((values) => addLog(`callWithArray: ${JSON.stringify(values)}`))
        }
      />
      <Button
        title="Call with Map"
        onPress={() =>
          CallbackTest.callWithMap((info) => addLog(`callWithMap: ${JSON.stringify(info)}`))
        }
      />
      <Button
        title="Call with Mixed Args"
        onPress={() =>
          CallbackTest.callWithMixedArgs((flag, num, text, list) =>
            addLog(`callWithMixedArgs: ${JSON.stringify([flag, num, text, list])}`)
          )
        }
      />
      <Button
        title="Call with Null"
        onPress={() =>
          CallbackTest.callWithNull((value) =>
            addLog(
              `callWithNull: ${value === null ? 'null' : value === undefined ? 'undefined' : value}`
            )
          )
        }
      />
      <Button
        title="Call with Record and Callback"
        onPress={() =>
          CallbackTest.callWithRecordAndCallback({ percent: 0.25, stage: 'queued' }, (progress) =>
            addLog(`callWithRecordAndCallback: ${JSON.stringify(progress)}`)
          )
        }
      />

      <HeadingText>Callback shapes</HeadingText>
      <Button
        title="Call multiple (3x)"
        onPress={() => CallbackTest.callMultiple((value) => addLog(`callMultiple: ${value}`))}
      />
      <Button
        title="Call with Two Callbacks"
        onPress={() =>
          CallbackTest.callWithTwoCallbacks(
            (percent) => addLog(`callWithTwoCallbacks onProgress: ${percent}`),
            (status) => addLog(`callWithTwoCallbacks onDone: ${status}`)
          )
        }
      />
      <Button
        title="Call Optional (with function)"
        onPress={() => CallbackTest.callOptional((value) => addLog(`callOptional: ${value}`))}
      />
      <Button
        title="Call Optional (undefined)"
        onPress={() => {
          CallbackTest.callOptional(undefined);
          addLog('callOptional: called with undefined (no callback fired)');
        }}
      />

      <HeadingText>Async and threads</HeadingText>
      <Button
        title="Simulate download (AsyncFunction)"
        onPress={() => {
          addLog('simulateDownload: start');
          CallbackTest.simulateDownload((status) =>
            addLog(`simulateDownload: ${status.stage} ${Math.round(status.percent * 100)}%`)
          )
            .then(() => addLog('simulateDownload: resolved'))
            .catch((error) => addLog(`simulateDownload: rejected ${String(error)}`));
        }}
      />
      {CallbackTest.supportsJSMethod && (
        <Button
          title="Simulate download (@JS, iOS)"
          onPress={() => {
            addLog('simulateDownloadJS: start');
            CallbackTest.simulateDownloadJS((percent) =>
              addLog(`simulateDownloadJS: ${Math.round(percent * 100)}%`)
            )
              .then(() => addLog('simulateDownloadJS: resolved'))
              .catch((error) => addLog(`simulateDownloadJS: rejected ${String(error)}`));
          }}
        />
      )}
      <Button
        title="Simulate download with Result"
        onPress={() => {
          addLog('simulateDownloadWithResult: start');
          CallbackTest.simulateDownloadWithResult((percent) =>
            addLog(`simulateDownloadWithResult: ${Math.round(percent * 100)}%`)
          )
            .then((result) => addLog(`simulateDownloadWithResult: resolved with "${result}"`))
            .catch((error) => addLog(`simulateDownloadWithResult: rejected ${String(error)}`));
        }}
      />
      <Button
        title="Call from Background Thread"
        onPress={() =>
          CallbackTest.callFromBackgroundThread((value) =>
            addLog(`callFromBackgroundThread: ${value}`)
          )
        }
      />
      <Button title="Clear log" onPress={() => setLog([])} />

      <HeadingText>Log</HeadingText>
      <View style={styles.logContainer}>
        {log.length === 0 ? (
          <Text style={styles.placeholder}>Press a button to fire a callback</Text>
        ) : (
          log.map((entry, index) => <MonoText key={index}>{entry}</MonoText>)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
  logContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 100,
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
  },
});
