import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function () {
  return (
    <>
      <Text testID="e2e-screen">Three</Text>
      <Link testID="e2e-navigate-apple" href="/(tabs)/three/apple">
        Navigate apple
      </Link>
    </>
  );
}
