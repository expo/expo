import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useTimer } from '../../utils/useTimer';

export default function Performance() {
  const time = useTimer();
  heavyOperation();
  const elements = Array.from({ length: (time % 2 ? 300 : 400) + time }, (_, i) => (
    <View key={i} style={{ padding: 8, backgroundColor: '#222', marginBottom: 8 }}>
      <Text style={{ color: '#fff' }}>
        Element {i + 1} - Time: {time}
      </Text>
    </View>
  ));
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: '#000' }}>
      <Text style={{ color: '#fff' }}>Performance - One</Text>
      <Text style={{ color: '#fff' }}>Time: {time}</Text>
      <Link href="/performance" style={{ color: '#fff' }}>
        <Link.Trigger>Link.Preview: /performance</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/performance/mosaic" style={{ color: '#fff' }}>
        <Link.Trigger>Link.Preview: /performance/mosaic</Link.Trigger>
        <Link.Preview />
      </Link>
      {elements}
    </ScrollView>
  );
}

const heavyOperation = () => {
  // Simulate a heavy operation
  for (let i = 0; i < 1e7; i++) {
    Math.sqrt(i);
  }
};
