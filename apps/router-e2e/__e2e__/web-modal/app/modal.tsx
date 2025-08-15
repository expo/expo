import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text testID="modal-title" style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Make Modals Great Again
      </Text>
      <Text>This modal is rendered using the custom drawer integration for web.</Text>
    </View>
  );
}
