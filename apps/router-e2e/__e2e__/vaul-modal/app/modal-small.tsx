import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Small Modal</Text>
      <Text>This is a small, centred modal to demonstrate default behaviour.</Text>
    </View>
  );
}
