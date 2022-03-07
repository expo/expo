import { useMemo, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';

export default (fromValue: number, toValue: number) => {
  const intensity = useMemo(() => new Animated.Value(fromValue), []);

  const _animate = useCallback(() => {
    const baseAnimationConfig = {
      duration: 2500,
      isInteraction: false,
      useNativeDriver: false,
    };
    const animateInConfig = {
      ...baseAnimationConfig,
      toValue,
    };
    const animateOutConfig = {
      ...baseAnimationConfig,
      toValue: fromValue,
    };

    Animated.timing(intensity, animateInConfig).start(() => {
      Animated.timing(intensity, animateOutConfig).start(_animate);
    });
  }, [intensity]);

  useEffect(() => {
    _animate();
  }, []);

  return intensity;
};
