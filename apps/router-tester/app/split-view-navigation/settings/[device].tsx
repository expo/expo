import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function Device() {
  const { device } = useLocalSearchParams<{ device: string }>();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
      <Stack.Screen options={{ title: `Device ${device}` }} />
      <Text testID="split-view-navigation-device-screen">Device {device}</Text>
    </ScrollView>
  );
}
