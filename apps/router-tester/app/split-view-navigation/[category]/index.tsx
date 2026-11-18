import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Category() {
  const { category } = useLocalSearchParams<{ category: string }>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text testID="split-view-navigation-category">Category {category}, no entry selected</Text>
    </View>
  );
}
