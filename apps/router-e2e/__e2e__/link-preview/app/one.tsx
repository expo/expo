import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function One() {
  const { time } = useLocalSearchParams();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(11, 103, 175)',
      }}>
      <Text style={{ color: '#fff', fontSize: 24 }}>One</Text>
      {time !== undefined && <Text style={{ color: '#fff' }}>Time: {time}</Text>}
    </View>
  );
}
