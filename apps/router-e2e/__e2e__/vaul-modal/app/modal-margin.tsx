import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Modal With Margin</Text>
      <Text>This modal applies margin via contentStyle in layout.</Text>
    </View>
  );
}
