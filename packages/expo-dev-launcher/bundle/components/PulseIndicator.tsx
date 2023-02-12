import { StatusIndicator } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated } from 'react-native';

type PulseIndicatorProps = {
  isActive?: boolean;
  color: string;
};

export function PulseIndicator({ isActive, color }: PulseIndicatorProps) {
  const animatedValue = React.useRef(new Animated.Value(0));

  const pulseScale = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 2],
  });

  const pulseOpacity = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const loop = React.useRef(
    Animated.loop(
      Animated.timing(animatedValue.current, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    )
  );

  React.useEffect(() => {
    if (isActive) {
      loop.current.start();
    } else {
      animatedValue.current.setValue(0);
      loop.current.stop();
      loop.current.reset();
    }
  }, [isActive]);

  return (
    <StatusIndicator size="small" style={{ backgroundColor: color }}>
      <Animated.View
        style={{
          flex: 1,
          borderRadius: 100,
          transform: [{ scale: pulseScale }],
          opacity: pulseOpacity,
          backgroundColor: color,
        }}
      />
    </StatusIndicator>
  );
}
