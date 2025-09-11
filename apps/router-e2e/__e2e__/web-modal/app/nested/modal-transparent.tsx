import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Transparent Modal</Text>
      <Text>This is a transparent modal to demonstrate default behaviour.</Text>
    </View>
  );
}
