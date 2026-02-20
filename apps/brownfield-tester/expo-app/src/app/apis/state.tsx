import * as ExpoBrownfield from 'expo-brownfield';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components';
import { useEffect, useRef } from 'react';

const State = () => {
  return (
    <ScrollView style={styles.container}>
      <Header title="Shared State" />
      {/* Data types */}
      <DataTypesDemo />
      {/* Operations */}
      <OperationsDemo />
      {/* Native -> JS synchronization */}
      <NativeToJSDemo />
      {/* JS -> Native synchronization */}
      <JStoNativeDemo />
    </ScrollView>
  );
};

const DataTypesDemo = () => {
  const [number, setNumber] = ExpoBrownfield.useSharedState<number>('number', 0);
  const [string, setString] = ExpoBrownfield.useSharedState<string>('string', 'ex');
  const [boolean, setBoolean] = ExpoBrownfield.useSharedState<boolean>('boolean', false);
  const [array, setArray] = ExpoBrownfield.useSharedState<any[]>('array', []);
  const [object, setObject] = ExpoBrownfield.useSharedState<Record<string, any>>('object', {});

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Data types</Text>
      <View>
        <DataTypesDemoItem
          label="Number"
          text={String(number)}
          onPress={() => setNumber((p) => (p ?? 0) + 1)}
        />
        <DataTypesDemoItem
          label="String"
          text={string ?? '""'}
          onPress={() => setString((p) => (p ?? '') + 'ex')}
        />
        <DataTypesDemoItem
          label="Boolean"
          text={String(boolean)}
          onPress={() => setBoolean((p) => !p)}
        />
        <DataTypesDemoItem
          label="Array"
          text={JSON.stringify(array)}
          onPress={() =>
            setArray((p) => [...(p ?? []), 'ex', 1, 2.34, false, null, undefined, { a: 'b' }])
          }
        />
        <DataTypesDemoItem
          label="Object"
          text={JSON.stringify(object)}
          onPress={() => setObject((p) => ({ ...p, a: 'b', c: { d: 'e', f: ['g', { h: 'i' }] } }))}
        />
      </View>
    </View>
  );
};

const DataTypesDemoItem = ({
  label,
  text,
  onPress,
}: {
  label: string;
  text: string;
  onPress: () => void;
}) => {
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Button title="Set" onPress={onPress} />
      </View>
      <Text style={styles.value}>{text}</Text>
    </View>
  );
};

const OperationsDemo = () => {
  const [number, setNumber] = ExpoBrownfield.useSharedState<number>('operations-number', 0);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Operations</Text>
      <Text>Value: {String(number)}</Text>
      <Text style={styles.label}>Set</Text>
      <View style={styles.row}>
        <Button title="0" onPress={() => setNumber(0)} />
        <Button title="0.5" onPress={() => setNumber(0.5)} />
        <Button title="1" onPress={() => setNumber(1)} />
        <Button title="5" onPress={() => setNumber(5)} />
        <Button title="100" onPress={() => setNumber(100)} />
      </View>
      <Button
        title="Delete"
        onPress={() => ExpoBrownfield.deleteSharedState('operations-number')}
      />
    </View>
  );
};

const NativeToJSDemo = () => {
  const [time] = ExpoBrownfield.useSharedState('time');

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Native to JS synchronization</Text>
      <Text>Time: {time ?? 'N/A'}</Text>
      <Button title="Delete" onPress={() => ExpoBrownfield.deleteSharedState('time')} />
    </View>
  );
};

const JStoNativeDemo = () => {
  const [_, setTime] = ExpoBrownfield.useSharedState('time-js', 'N/A');
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
    interval.current = setInterval(() => {
      setTime(new Date().toISOString());
    }, 1000);

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, []);

  return null;
};

export default State;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: 'black',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    textAlign: 'center',
  },
  value: {
    backgroundColor: 'lightgray',
    padding: 8,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
});
