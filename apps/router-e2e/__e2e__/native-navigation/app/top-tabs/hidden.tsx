import { Text, View } from 'react-native';

export default function Hidden() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text testID="e2e-screen">Hidden</Text>
    </View>
  );
}
