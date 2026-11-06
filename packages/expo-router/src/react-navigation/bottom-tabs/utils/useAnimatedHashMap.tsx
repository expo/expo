'use client';
import * as React from 'react';
import { Animated } from 'react-native';

import type { BottomTabViewState } from '../types';

export function useAnimatedHashMap({ routes, index }: BottomTabViewState) {
  const refs = React.useRef<Record<string, Animated.Value>>(Object.create(null));
  const previous = refs.current;
  const routeNames = Object.keys(previous);

  if (
    routes.length === routeNames.length &&
    routes.every((route) => routeNames.includes(route.name))
  ) {
    return previous;
  }
  refs.current = Object.create(null);

  routes.forEach(({ name }, i) => {
    refs.current[name] =
      previous[name] ?? new Animated.Value(i === index ? 0 : i >= index ? 1 : -1);
  });

  return refs.current;
}
