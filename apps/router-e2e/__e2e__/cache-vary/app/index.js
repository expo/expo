import { Text } from 'react-native';

export default function Page() {
  return <Text testID="env-value">{`env-value:${process.env.EXPO_PUBLIC_CACHE_VARY_VALUE}`}</Text>;
}
