import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Post() {
  const { post } = useLocalSearchParams();
  return <Text>Post: "{post}"</Text>;
}
