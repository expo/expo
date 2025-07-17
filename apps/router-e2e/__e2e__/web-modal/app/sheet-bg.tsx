import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'red' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Sheet with red background
      </Text>
      <Text>This sheet tests the background color.</Text>
    </View>
  );
}
