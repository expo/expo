import { Tabs, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <>
      <Pressable testID="e2e-back" onPress={() => router.back()}>
        <Text>Back</Text>
      </Pressable>
      <Tabs>
        <Tabs.Screen name="hidden" options={{ href: null }} />
      </Tabs>
    </>
  );
}
