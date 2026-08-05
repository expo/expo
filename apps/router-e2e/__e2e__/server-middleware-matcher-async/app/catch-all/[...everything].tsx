import { useGlobalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function CatchAllRoute() {
  const params = useGlobalSearchParams();
  return <Text testID="params">{(params.everything as string[]).join(',')}</Text>;
}
