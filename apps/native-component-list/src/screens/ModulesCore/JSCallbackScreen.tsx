import * as CallbackTest from 'callback-test';
import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

export default function JSCallbackScreen() {
  const [log, setLog] = React.useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const clearLog = () => setLog([]);

  return (
    <ScrollView style={styles.scrollView}>
      <HeadingText>JSCallback Tests</HeadingText>

      <Button
        title="Call with Int"
        onPress={() => {
          CallbackTest.callWithInt((value) => {
            addLog(`callWithInt → ${value}`);
          });
        }}
      />

      <Button
        title="Call Multiple (3x)"
        onPress={() => {
          CallbackTest.callMultiple((value) => {
            addLog(`callMultiple → ${value}`);
          });
        }}
      />

      <Button
        title="Call with Record"
        onPress={() => {
          CallbackTest.callWithRecord((progress) => {
            addLog(`callWithRecord → stage=${progress.stage}, percent=${progress.percent}`);
          });
        }}
      />

      <Button
        title="Call with Enum"
        onPress={() => {
          CallbackTest.callWithEnum((stage) => {
            addLog(`callWithEnum → ${stage}`);
          });
        }}
      />

      <Button
        title="Simulate Download (async, 3 updates)"
        onPress={() => {
          addLog('Starting simulated download...');
          CallbackTest.simulateDownload((status) => {
            addLog(`simulateDownload → ${status.stage} (${Math.round(status.percent * 100)}%)`);
          });
        }}
      />

      <Button
        title="Greet with Callback"
        onPress={() => {
          CallbackTest.greetWithCallback('Expo', (greeting) => {
            addLog(`greetWithCallback → ${greeting}`);
          });
        }}
      />

      <Button title="Clear Log" onPress={clearLog} color="#888" />

      <HeadingText>Log</HeadingText>
      <View style={styles.logContainer}>
        {log.length === 0 ? (
          <Text style={styles.placeholder}>Press a button above to test callbacks</Text>
        ) : (
          log.map((entry, i) => <MonoText key={i}>{entry}</MonoText>)
        )}
      </View>
    </ScrollView>
  );
}

function Button({ title, onPress, color }: { title: string; onPress: () => void; color?: string }) {
  return (
    <Pressable style={[styles.button, color ? { backgroundColor: color } : null]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    padding: 10,
  },
  button: {
    backgroundColor: '#4630EB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
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
