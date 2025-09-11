import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useTimer } from '../../utils/useTimer';

export default function Performance() {
  const time = useTimer();
  const elements = Array.from({ length: (time % 2 ? 500 : 700) + time }, (_, i) => (
    <View key={i} style={{ padding: 8, backgroundColor: '#f0f0f0', marginBottom: 8 }}>
      <Text>
        Element {i + 1} - Time: {time}
      </Text>
    </View>
  ));
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <Text>Performance</Text>
      <Text>Time: {time}</Text>
      <Link href="/performance/one">
        <Link.Trigger>Link.Preview: /performance/one</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/performance/mosaic">
        <Link.Trigger>Link.Preview: /performance/mosaic</Link.Trigger>
        <Link.Preview />
      </Link>
      {elements}
    </ScrollView>
  );
}
