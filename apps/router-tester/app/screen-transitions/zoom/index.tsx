import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Transition from 'react-native-screen-transitions';

import { ZOOM_ITEMS } from '@/components/zoom-items';

export default function ZoomGrid() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <Transition.ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Lets the thumbnails escape the ScrollView clipping during the zoom. */}
        <Transition.Boundary.Host />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {ZOOM_ITEMS.map((item) => (
            <Transition.Boundary
              key={item.id}
              id={item.id}
              escapeClipping
              accessibilityRole="button"
              accessibilityLabel={`Thumbnail ${item.title}`}
              onPress={() => router.push(`/screen-transitions/zoom/${item.id}`)}
              style={{
                width: 110,
                height: 110,
                borderRadius: 16,
                padding: 8,
                justifyContent: 'flex-end',
                backgroundColor: item.color,
              }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{item.title}</Text>
            </Transition.Boundary>
          ))}
        </View>
      </Transition.ScrollView>
    </SafeAreaView>
  );
}
