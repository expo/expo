import { useLocalSearchParams } from 'expo-router';
import { useSplitView } from 'expo-router/unstable-split-view';
import { Button, ScrollView, Text } from 'react-native';

export default function Entry() {
  const { category, entry } = useLocalSearchParams<{ category: string; entry: string }>();
  const { show } = useSplitView();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
      <Text testID="split-view-navigation-entry">
        {entry} in {category}
      </Text>
      <Button title="Show entries" onPress={() => show('supplementary')} />
    </ScrollView>
  );
}
