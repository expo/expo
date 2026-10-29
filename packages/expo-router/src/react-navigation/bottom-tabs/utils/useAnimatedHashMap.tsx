'use client';
import * as React from 'react';
import { Animated } from 'react-native';

import type { BottomTabViewState } from '../types';

export function useAnimatedHashMap({ routes, index }: BottomTabViewState) {
  const refs = React.useRef<Record<string, Animated.Value>>({});
  const focusedKeyRef = React.useRef<string | undefined>(undefined);
  const previous = refs.current;
  const previousFocusedKey = focusedKeyRef.current;
  focusedKeyRef.current = routes[index]?.key;
  const routeKeys = Object.keys(previous);

  if (
    routes.length === routeKeys.length &&
    routes.every((route) => routeKeys.includes(route.key))
  ) {
    return previous;
  }
  refs.current = {};

  routes.forEach(({ key }, i) => {
    refs.current[key] = previous[key] ?? new Animated.Value(i === index ? 0 : i >= index ? 1 : -1);
  });

  return refs.current;
}
