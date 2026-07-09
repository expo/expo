import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Platform, PlatformColor, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#161b22' : '#fff' }]}>
      <Text style={[styles.title, styles.text]}>minimal-swiftpm</Text>
      <Text style={styles.text}>Expo SDK {Constants.expoConfig?.sdkVersion ?? 'dev'}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  text: {
    ...Platform.select({
      ios: { color: PlatformColor('labelColor') },
    }),
  },
});
