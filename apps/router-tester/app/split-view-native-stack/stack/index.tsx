import { Link } from 'expo-router';
import { Button, ScrollView, Text } from 'react-native';

import { useNativeStackSpike } from '@/components/native-stack-spike';

export default function Index() {
  const spike = useNativeStackSpike();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text selectable testID="native-stack-first-row">
        First row: inspect its inset below the large title.
      </Text>
      <Button
        title={spike.integrated ? 'Integration enabled' : 'Enable native integration'}
        disabled={spike.integrated}
        onPress={spike.enableIntegration}
      />
      <Text selectable testID="native-stack-secondary-ownership">
        {JSON.stringify(spike.ownership, null, 2)}
      </Text>
      <Link href="/split-view-native-stack/stack/pushed" push>
        Push screen
      </Link>
      <Link href="/split-view-native-stack/stack/modal">Present sheet</Link>
      <Link href="/split-view-native-stack/stack/nested">Nested Stack</Link>
      <Button title="Show primary column" onPress={spike.showPrimary} />
      <Button title="Inspect ownership" onPress={spike.inspect} />
      {Array.from({ length: 30 }, (_, index) => (
        <Text key={index}>Scroll row {index + 1}</Text>
      ))}
    </ScrollView>
  );
}
