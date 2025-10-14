import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Id() {
  const { id, type } = useLocalSearchParams();

  console.log('Rendering [type]/[id] with id:', id, type);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>ID: {id}</Text>
    </View>
  );
}
