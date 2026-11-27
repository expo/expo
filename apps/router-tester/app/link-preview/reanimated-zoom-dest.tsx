import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function ReanimatedZoomDest() {
  const size = useSharedValue(120);
  const sizeStyle = useAnimatedStyle(() => ({ width: size.value, height: size.value }));

  useEffect(() => {
    size.value = withTiming(240, { duration: 600 });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Link.AppleZoomTarget>
        <Animated.View
          testID="reanimated-zoom-target"
          accessible
          accessibilityLabel="Animated zoom target"
          style={[{ backgroundColor: '#3E517A' }, sizeStyle]}
        />
      </Link.AppleZoomTarget>
      <Text>Reanimated zoom destination</Text>
    </View>
  );
}
