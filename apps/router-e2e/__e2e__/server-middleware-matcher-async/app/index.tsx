import { Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text testID="title">Index</Text>
    </View>
  );
}
