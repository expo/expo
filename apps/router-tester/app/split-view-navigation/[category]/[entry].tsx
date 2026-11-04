import { useLocalSearchParams } from 'expo-router';
import { useSplitView } from 'expo-router/unstable-split-view';
import { Button, Text, View } from 'react-native';

export default function Entry() {
  const { category, entry } = useLocalSearchParams<{ category: string; entry: string }>();
  const { show } = useSplitView();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Text testID="split-view-navigation-entry">
        {entry} in {category}
      </Text>
      <Button title="Show entries" onPress={() => show('supplementary')} />
    </View>
  );
}
