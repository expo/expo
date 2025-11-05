import { Text, View } from 'react-native';

export default function Protected() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
      <Text>Protected Route</Text>
    </View>
  );
}
