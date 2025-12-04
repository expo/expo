import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { useFaceColors } from '../../components/faces';

export default function Index() {
  const [shouldPerformHeavyComputation, setShouldPerformHeavyComputation] = useState(false);
  const { face } = useLocalSearchParams();

  const colors = useFaceColors();
  const { color, name } = colors[Number(face) % colors.length];

  if (shouldPerformHeavyComputation) {
    heavyComputation();
  }
  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: color,
        }}
        contentContainerStyle={{
          height: '150%',
        }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: '#fff' }}>Heavy Computation</Text>
          <Switch
            value={shouldPerformHeavyComputation}
            onValueChange={setShouldPerformHeavyComputation}
          />
        </View>
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
