import { useGlobalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Post() {
  const params = useGlobalSearchParams();
  return <Text>Post: {params.post}</Text>;
}
