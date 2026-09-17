import { useLocalSearchParams } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import { Text, View } from 'react-native';

export default function Id() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ padding: 24 }}>
      <SplitView.Screen options={{ title: String(id) }} />
      <Text>ID: {id}</Text>
    </View>
  );
}
