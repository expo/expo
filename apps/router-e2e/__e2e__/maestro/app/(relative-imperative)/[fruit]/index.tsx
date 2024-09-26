import { Link, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function RelativeFruit() {
  return (
    <>
      <Pressable testID="e2e-goto-banana" onPress={() => router.push('./banana')}>
        <Text>Go to banana</Text>
      </Pressable>
      <Pressable
        testID="e2e-goto-banana-relative-directory"
        onPress={() => router.push('./banana', { relativeToDirectory: true })}>
        <Text>Go to banana (relative to directory)</Text>
      </Pressable>
    </>
  );
}
