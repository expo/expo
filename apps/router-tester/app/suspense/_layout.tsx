import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function Layout() {
  return <Stack />;
}

export function SuspenseFallback() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'red',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>fallback</Text>
    </View>
  );
}
