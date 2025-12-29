import { Link, usePreventZoomTransitionDismissal } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

export default function ZoomDestScreen() {
  const [shouldPrevent, setShouldPrevent] = useState(false);
  usePreventZoomTransitionDismissal(
    shouldPrevent
      ? undefined
      : {
          unstable_dismissalBoundsRect: { minX: 0, minY: 0 },
        }
  );
  return (
    <ScrollView
      style={{ flex: 1 }}
      onScroll={(event) => {
        setShouldPrevent(event.nativeEvent.contentOffset.y > 1);
      }}>
      <Link.AppleZoomTarget>
        <View style={{ width: '100%', aspectRatio: 1 }}>
          <Image
            source={require('../../../assets/frog.jpg')}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </Link.AppleZoomTarget>
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <Image
          src="https://picsum.photos/seed/1/800/600"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <Image
          src="https://picsum.photos/seed/2/800/600"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </ScrollView>
  );
}
