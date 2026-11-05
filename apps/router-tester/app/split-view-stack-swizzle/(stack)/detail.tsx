import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Control, DemoControls, styles } from '@/components/split-view-stack-swizzle';

export default function Detail() {
  const router = useRouter();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Stack detail content</Text>
      <DemoControls />
      <Control
        label="Push Stack deep detail"
        onPress={() => router.push('/split-view-stack-swizzle/deep')}
      />
      <Control
        label="Open Stack modal"
        onPress={() => router.push('/split-view-stack-swizzle/modal')}
      />
      <Control label="Back to Split root" onPress={() => router.back()} />
    </ScrollView>
  );
}
