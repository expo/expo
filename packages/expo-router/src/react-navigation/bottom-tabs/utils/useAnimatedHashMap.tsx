import type { NavigationState } from '@react-navigation/routers';
import * as React from 'react';
import { Animated } from 'react-native';

export function useAnimatedHashMap({ routes, index }: NavigationState) {
  const refs = React.useRef<Record<string, Animated.Value>>({});
  const previous = refs.current;
  const routeKeys = Object.keys(previous);

  if (
    routes.length === routeKeys.length &&
    routes.every((route) => routeKeys.includes(route.key))
  ) {
    return previous;
  }
  refs.current = {};

  routes.forEach(({ key }, i) => {
    refs.current[key] =
      previous[key] ??
      new Animated.Value(i === index ? 0 : i >= index ? 1 : -1);
  });

  return refs.current;
}
