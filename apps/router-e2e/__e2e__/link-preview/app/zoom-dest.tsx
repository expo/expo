import { usePreventZoomTransitionDismissal, type DismissalBoundsRect } from 'expo-router';
import { Image, useWindowDimensions, View } from 'react-native';

export default function ZoomDestScreen() {
  const dimensions = useWindowDimensions();
  const dismissalBoundsRect: DismissalBoundsRect = {
    minX: 100,
    maxX: dimensions.width - 100,
    minY: dimensions.height - 400,
    maxY: dimensions.height - 100,
  };
  usePreventZoomTransitionDismissal({
    unstable_dismissalBoundsRect: dismissalBoundsRect,
  });
  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('../../../assets/frog.jpg')}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />
      <View
        style={{
          position: 'absolute',
          top: dismissalBoundsRect.minY,
          left: dismissalBoundsRect.minX,
          right: dimensions.width - (dismissalBoundsRect.maxX ?? dimensions.width),
          bottom: dimensions.height - (dismissalBoundsRect.maxY ?? dimensions.height),
          backgroundColor: 'rgba(0, 255, 0, 0.7)',
        }}
      />
    </View>
  );
}
