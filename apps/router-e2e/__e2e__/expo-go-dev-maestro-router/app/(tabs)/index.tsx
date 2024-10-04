import { Link, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">One</Text>
      <Link testID="e2e-goto-apple" href="/(tabs)/three/apple">
        Goto apple
      </Link>
    </>
  );
}
