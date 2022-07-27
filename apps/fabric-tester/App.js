import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const isFabricEnabled = global.nativeFabricUIManager != null;
  const [reverse, setReverse] = useState(false);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>isFabricEnabled: {isFabricEnabled + ''}</Text>
      <Button title="toggle style" onPress={() => { setReverse(!reverse); }} />
      <LinearGradient style={styles.gradient} colors={reverse ? ['yellow', 'blue'] : ['blue', 'yellow']} end={reverse ? { x: 1.0, y: 0.5 } : { x: 0.5, y: 1.0 }} />
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
  gradient: {
    width: 400,
    height: 200,
  }
});
