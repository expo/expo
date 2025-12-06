import { useMemo, useState } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';

export default function ZoomDestScreen() {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | undefined>();
  const { width, height } = useWindowDimensions();
  const imageStyle = useMemo(() => {
    if (!imageSize) {
      return { width: '100%', height: '100%' } as const;
    }
    const imageAspectRatio = imageSize.width / imageSize.height;
    const containerAspectRatio = width / height;
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      return { width, height: height * (containerAspectRatio / imageAspectRatio) } as const;
    } else {
      // Image is taller than container
      return { height, width: width * (imageAspectRatio / containerAspectRatio) } as const;
    }
  }, [imageSize, width, height]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        onLoad={(e) => {
          if (process.env.EXPO_OS !== 'web') {
            setImageSize({
              width: e.nativeEvent.source.width,
              height: e.nativeEvent.source.height,
            });
          }
        }}
        source={require('../../../assets/frog.jpg')}
        style={imageStyle}
      />
    </View>
  );
}
