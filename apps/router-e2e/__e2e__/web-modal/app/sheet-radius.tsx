import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Large Radius Sheet</Text>
      <Text>This sheet demonstrates a custom large corner radius.</Text>
    </View>
  );
}
