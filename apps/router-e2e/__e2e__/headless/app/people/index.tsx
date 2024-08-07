import { Text } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';

export default function People() {
  return <Text>{JSON.stringify({ params: useLocalSearchParams(), pathname: usePathname() })}</Text>;
}
