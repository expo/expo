import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Id() {
  const { id, type } = useLocalSearchParams();

  console.log('Rendering [type]/[id] with id:', id, type);

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>ID: {id}</Text>
    </SafeAreaView>
  );
}
