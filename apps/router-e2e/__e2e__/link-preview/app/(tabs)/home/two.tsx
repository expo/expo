import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeTwo() {
  const { time } = useLocalSearchParams();
  return (
    <View>
      <Text>Time: {time}</Text>
    </View>
  );
}
