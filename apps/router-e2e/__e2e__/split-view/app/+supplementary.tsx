import { Text, View } from 'react-native';

export default function Sidebar() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'lightgreen',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Supplementary</Text>
    </View>
  );
}
