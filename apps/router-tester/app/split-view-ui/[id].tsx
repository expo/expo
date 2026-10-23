import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nextId = id === 'one' ? 'two' : 'one';

  return (
    <View style={{ flex: 1, borderTopWidth: 12, borderTopColor: 'red', padding: 20 }}>
      <Text style={{ fontSize: 24 }}>{id}</Text>
      <Link href={`/split-view-ui/${nextId}`} push asChild>
        <Pressable accessibilityRole="button" style={{ paddingVertical: 20 }}>
          <Text>Push {nextId}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
