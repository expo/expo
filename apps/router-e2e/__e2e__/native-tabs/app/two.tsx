import { Text, View } from 'react-native';

export default function Two() {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#afa' }}>
      <Text testID="e2e-screen">Two</Text>
    </View>
  );
}
