import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">Modal2</Text>
      <Pressable testID="e2e-dismiss-all" onPress={() => router.dismissAll()}>
        <Text>Dismiss all</Text>
      </Pressable>
    </>
  );
}
