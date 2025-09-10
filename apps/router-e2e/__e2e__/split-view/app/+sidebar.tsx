import { Text, View } from 'react-native';

export default function Sidebar() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'lightblue',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Sidebar</Text>
    </View>
  );
}
