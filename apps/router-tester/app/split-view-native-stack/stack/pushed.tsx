import { Link, router } from 'expo-router';
import { Button, ScrollView, Text } from 'react-native';

import { useNativeStackSpike } from '@/components/native-stack-spike';

export default function Pushed() {
  const { inspect } = useNativeStackSpike();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text selectable>Cancel and complete the native back gesture, then compare JS Back.</Text>
      <Button title="JS Back" onPress={() => router.back()} />
      <Button title="Inspect ownership" onPress={inspect} />
      <Link href="/split-view-native-stack/stack/modal">Present sheet over pushed screen</Link>
    </ScrollView>
  );
}
