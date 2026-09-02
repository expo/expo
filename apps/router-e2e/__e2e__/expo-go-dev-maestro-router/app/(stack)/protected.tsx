import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Protected() {
  const params = useLocalSearchParams();

  if (!params.permissions) {
    return <Redirect href="/permissions" />;
  }

  return <Text>protected</Text>;
}
