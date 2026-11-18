import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Device() {
  const { device } = useLocalSearchParams<{ device: string }>();
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Stack.Screen options={{ title: `Device ${device}` }} />
      <Text testID="split-view-navigation-device-screen">Device {device}</Text>
    </View>
  );
}
