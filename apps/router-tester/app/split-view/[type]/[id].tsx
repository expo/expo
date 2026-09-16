import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Id() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ padding: 24 }}>
      <Text>ID: {id}</Text>
    </View>
  );
}
