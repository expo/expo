import { ScrollView, Text } from 'react-native';

export default function WidgetsScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20 }}>
      <Text selectable>Widgets are available only on iOS and Android.</Text>
    </ScrollView>
  );
}
