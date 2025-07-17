import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text
        testID="modal-title-multi"
        style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Multi Detent Sheet
      </Text>
      <Text>This modal provides multiple detents for extensive responsiveness testing.</Text>
    </View>
  );
}
