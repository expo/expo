import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Non modal route</Text>
      <Text>This screen is not a modal, but it is pushed to the stack from a modal.</Text>
    </View>
  );
}
