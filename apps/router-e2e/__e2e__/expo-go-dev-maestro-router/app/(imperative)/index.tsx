import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <Pressable testID="e2e-fruit" onPress={() => router.push('/apple')}>
      <Text testID="e2e-screen">Imperative index</Text>
    </Pressable>
  );
}
