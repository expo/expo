import { useMemo, useEffect, useCallback, EffectCallback, DependencyList, useState } from 'react';
import { Animated } from 'react-native';

export const useLoopingAnimatedValue = (fromValue: number, toValue: number) => {
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

export const useDelayedEffect = (callback: EffectCallback, deps: DependencyList, delay: number) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    timeoutId && clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
    return () => timeoutId && clearTimeout(timeoutId);
  }, [callback, delay, ...deps]);
};

export const useResettingState = <T>(value: T | undefined, timeout: number) => {
  const [state, setState] = useState<T | undefined>(value);

  useDelayedEffect(
    () => {
      state !== undefined && setState(undefined);
    },
    [state],
    timeout
  );

  return [state, setState] as const;
};
