import { useMemo } from 'react';
import { Text, View } from 'react-native';

export default function RandomScreen() {
  const value = useMemo(() => Math.random(), []);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Random Value: {value}</Text>
    </View>
  );
}
