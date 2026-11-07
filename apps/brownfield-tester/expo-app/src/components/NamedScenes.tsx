import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const runtimeId = Math.random().toString(36).slice(2, 8);

export function CounterScene({ label, value }: { label: string; value: number }) {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{label}</Text>
      <Text>Native value: {value}</Text>
      <Text>Local count: {count}</Text>
      <Text>Runtime: {runtimeId}</Text>
      <Button title={`Increment ${label}`} onPress={() => setCount(count + 1)} />
    </View>
  );
}

export function SummaryScene({ value }: { value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Summary</Text>
      <Text>Native value: {value}</Text>
      <Text>Runtime: {runtimeId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    gap: 8,
    backgroundColor: '#eef5ff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
