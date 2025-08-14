import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

export default function Index() {
  const { face } = useLocalSearchParams();
  heavyComputation();
  return (
    <>
      <Stack.Screen options={{ title: `#${face}` }} />
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: `#${face}`,
        }}
        contentContainerStyle={{
          height: '150%',
        }}
        contentInsetAdjustmentBehavior="automatic">
        <Link href="/404" style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>
          Try and go to 404
        </Link>
      </ScrollView>
    </>
  );
}

function heavyComputation() {
  // Simulate a heavy computation
  let x = 0;
  for (let i = 0; i < 1e8; i++) {
    x += i / 10;
  }
  return x;
}
