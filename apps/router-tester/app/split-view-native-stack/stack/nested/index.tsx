import { router } from 'expo-router';
import { Button, ScrollView, Text } from 'react-native';

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text selectable>
        The nested Stack must remain inside its screen; it must not replace the column owner.
      </Text>
      <Button title="Dismiss nested Stack" onPress={() => router.back()} />
    </ScrollView>
  );
}
