import { router } from 'expo-router';
import { Button, ScrollView, Text } from 'react-native';

import { useNativeStackSpike } from '@/components/native-stack-spike';

export default function Modal() {
  const { changeTitle, inspect } = useNativeStackSpike();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text selectable>
        Change the underlying root header while this sheet is open; dismiss and check for a header
        swap.
      </Text>
      <Button title="Change underlying title" onPress={changeTitle} />
      <Button title="Inspect underlying ownership" onPress={inspect} />
      <Button title="Dismiss sheet" onPress={() => router.dismiss()} />
    </ScrollView>
  );
}
