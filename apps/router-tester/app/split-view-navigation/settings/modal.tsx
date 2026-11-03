import { router } from 'expo-router';
import { Button, ScrollView } from 'react-native';

export default function Modal() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="router.back()" onPress={() => router.back()} />
    </ScrollView>
  );
}
