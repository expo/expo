import { Text, View } from 'react-native';

import { useTimer } from '../utils/useTimer';

export default function Performance() {
  const time = useTimer();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Time: {time}</Text>
    </View>
  );
}
