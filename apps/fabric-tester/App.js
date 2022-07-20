import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const isFabricEnabled = global.nativeFabricUIManager != null;

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Text>isFabricEnabled: {isFabricEnabled + ''}</Text>
      <LinearGradient style={styles.gradient} colors={['blue', 'yellow']} />
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
