import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function Category() {
  const { category } = useLocalSearchParams<{ category: string }>();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text testID="split-view-navigation-category">Category {category}, no entry selected</Text>
    </ScrollView>
  );
}
