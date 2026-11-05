import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Control, DemoControls, styles } from '@/components/split-view-stack-swizzle';

export default function Modal() {
  const router = useRouter();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Stack modal content</Text>
      <DemoControls />
      <Control label="Dismiss Stack modal" onPress={() => router.back()} />
    </ScrollView>
  );
}
