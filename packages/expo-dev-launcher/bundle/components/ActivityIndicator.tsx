import { LoadingIndicatorIcon } from 'expo-dev-client-components';
import * as React from 'react';
import { Animated, Easing } from 'react-native';

type ActivityIndicatorProps = Partial<React.ComponentProps<typeof LoadingIndicatorIcon>>;

export function ActivityIndicator(props: ActivityIndicatorProps) {
  const animatedValue = React.useRef(new Animated.Value(0));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue.current, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ position: 'absolute', transform: [{ rotateZ: rotate }] }}>
      <LoadingIndicatorIcon {...props} />
    </Animated.View>
  );
}
