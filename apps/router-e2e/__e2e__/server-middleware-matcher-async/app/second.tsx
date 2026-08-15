import { Text, View } from 'react-native';

export default function SecondRoute() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text testID="title">Second</Text>
    </View>
  );
}
