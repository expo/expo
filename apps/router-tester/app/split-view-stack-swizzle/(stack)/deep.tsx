import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Control, DemoControls, styles } from '@/components/split-view-stack-swizzle';

export default function DeepDetail() {
  const router = useRouter();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Stack deep detail content</Text>
      <DemoControls />
      <Control
        label="Open Stack modal"
        onPress={() => router.push('/split-view-stack-swizzle/modal')}
      />
      <Control label="Back to Stack detail" onPress={() => router.back()} />
    </ScrollView>
  );
}
