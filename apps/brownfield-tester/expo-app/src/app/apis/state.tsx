import Feather from '@expo/vector-icons/Feather';
import * as ExpoBrownfield from 'expo-brownfield';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/components';

const State = () => {
  const [counter, setCounter] = ExpoBrownfield.useSharedState<number>('counter', 0);
  const [counterDuplicated] = ExpoBrownfield.useSharedState<number>('counter-duplicated', 0);
  const [time] = ExpoBrownfield.useSharedState('time');

  return (
    <SafeAreaView>
      <Header title="Shared State" />
      {/* JS to native synchronization */}
      <Text style={styles.subTitle}>JS to native synchronization</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          testID="counter-plus"
          onPress={() => setCounter((prev) => (prev ?? 0) + 1)}>
          <Feather name="plus" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.counterText}>{String(counter)}</Text>
        <TouchableOpacity
          style={styles.counterButton}
          testID="counter-minus"
          onPress={() => setCounter((prev) => (prev ?? 0) - 1)}>
          <Feather name="minus" size={32} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.counterDemoContainer}>
        <InputDemo />
        <BlockDemo />
        <Text>Counter duplicated (in native): {String(counterDuplicated)}</Text>
      </View>

      {/* Native to JS synchronization */}
      <Text style={styles.subTitle}>Native to JS synchronization</Text>
      <View style={styles.timeDemoContainer}>
        <Text style={styles.timeText}>Time: {time?.time ?? 'N / A'}</Text>
        <TimeInputDemo />
      </View>
    </SafeAreaView>
  );
};

const InputDemo = () => {
  const [counter] = ExpoBrownfield.useSharedState<number>('counter');
  return <TextInput style={styles.counterInput} value={String(counter)} editable={false} />;
};

const BlockDemo = () => {
  const [counter] = ExpoBrownfield.useSharedState<number>('counter');
  return <Text style={styles.counterBlock}>Counter: {String(counter)}</Text>;
};

const TimeInputDemo = () => {
  const [time] = ExpoBrownfield.useSharedState('time');
  return <TextInput style={styles.timeInput} value={time?.time ?? 'N / A'} editable={false} />;
};

export default State;

const styles = StyleSheet.create({
  counterDemoContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  counterInput: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: 'black',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'gray',
  },
  counterBlock: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: 'black',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'orange',
  },
  counterButton: {
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  counterContainer: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  counterText: {
    fontSize: 64,
    fontWeight: 'semibold',
    color: 'black',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    textAlign: 'center',
  },
  timeDemoContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  timeInput: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: 'black',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'gray',
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
});
