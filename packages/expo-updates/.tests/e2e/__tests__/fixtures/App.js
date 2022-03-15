import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RETRY_COUNT = 5;

export default function App() {
  useEffect(async () => {
    for (let i = 0; i < RETRY_COUNT; i++) {
      const response = await fetch('http://10.0.2.2:UPDATES_PORT/notify/test');
      if (response.status === 200) {
        break;
      }
      // wait 50 ms and then try again
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
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
