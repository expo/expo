import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Transition from 'react-native-screen-transitions';

import { ZOOM_ITEMS } from '@/components/zoom-items';

export default function ZoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = ZOOM_ITEMS.find((i) => i.id === id) ?? ZOOM_ITEMS[0];

  return (
    <SafeAreaView style={{ flex: 1, padding: 24, gap: 16, backgroundColor: '#111' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        style={{ alignSelf: 'flex-start', padding: 8 }}>
        <Text style={{ color: '#fff' }}>Back</Text>
      </Pressable>
      {/* Zoom target for the thumbnail with the same id. */}
      <Transition.Boundary
        id={item.id}
        style={{ width: '100%', height: 280, borderRadius: 28, backgroundColor: item.color }}
      />
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{item.title}</Text>
      <Text style={{ color: '#aaa' }}>Detail for {item.id}</Text>
    </SafeAreaView>
  );
}
