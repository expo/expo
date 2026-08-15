import { useState } from 'react';
import { View, StyleSheet, Text, TurboModuleRegistry } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Header } from '@/components';

const BrownfieldTestModule = TurboModuleRegistry.get('BrownfieldTestModule');

const NativeModules = () => {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = BrownfieldTestModule != null;

  const callGreet = async () => {
    try {
      const result = await BrownfieldTestModule?.getGreeting('Expo');
      setGreeting(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setGreeting(null);
    }
  };

  return (
    <SafeAreaView>
      <Header title="Native Modules" />
      <View style={styles.container}>
        <Text style={styles.title}>Module status</Text>
        <Text
          style={[styles.status, { color: isAvailable ? 'lightgreen' : 'salmon' }]}
          testID="native-modules-status">
          BrownfieldTestModule: {isAvailable ? 'Available' : 'Not available'}
        </Text>
      </View>
      <ActionButton
        title="Call getGreeting('Expo')"
        description="Calls the custom native module registered by the hosting app"
        icon="terminal"
        onPress={callGreet}
        testID="native-modules-greet"
      />
      {greeting && (
        <View style={styles.container}>
          <Text style={styles.title}>Result</Text>
          <Text style={styles.result} testID="native-modules-result">
            {greeting}
          </Text>
        </View>
      )}
      {error && (
        <View style={styles.container}>
          <Text style={styles.title}>Error</Text>
          <Text style={[styles.result, { color: 'salmon' }]} testID="native-modules-error">
            {error}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NativeModules;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  result: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#121212',
    fontSize: 14,
    fontWeight: '400',
    color: 'lightgreen',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
