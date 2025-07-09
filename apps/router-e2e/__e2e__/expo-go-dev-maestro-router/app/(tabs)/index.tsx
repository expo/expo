import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function Index() {
  return (
    <>
      <Text testID="e2e-screen">One</Text>
      <Link testID="e2e-goto-apple" href="/(tabs)/three/apple">
        Goto apple
      </Link>
    </>
  );
}
