import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { Control, DemoControls, styles } from '@/components/split-view-stack-swizzle';

export default function Root() {
  const router = useRouter();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Split root content</Text>
      <DemoControls />
      <Control
        label="Push Stack detail"
        onPress={() => router.push('/split-view-stack-swizzle/detail')}
      />
      <Control
        label="Open Stack modal"
        onPress={() => router.push('/split-view-stack-swizzle/modal')}
      />
    </ScrollView>
  );
}
