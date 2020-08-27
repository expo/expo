import React from 'react';
import { Dimensions, Text } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const size = 50;

export default ({
  progress,
  y,
}: {
  progress: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
}) => {
  const style = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 0.1], [1, 0], Extrapolate.CLAMP),
      transform: [
        {
          translateX: interpolate(progress.value, [0, 0.4], [width - size - 8, 0]),
        },
        {
          translateY: y.value - size / 2,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}>
      <Text>(</Text>
    </Animated.View>
  );
};
