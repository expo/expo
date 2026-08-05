import { useGlobalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function PostByIdRoute() {
  const params = useGlobalSearchParams();
  return <Text testID="params">{params.post}</Text>;
}
