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

  // A route can be new and focused at once: an unvisited lazy tab is a placeholder route keyed by
  // its name, and the first visit replaces it with a route under a generated key. Its value has to
  // start beside the route it replaces, or the enter animation has nowhere to go.
  const previousIndex = routes.findIndex((route) => route.key === previousFocusedKey);

  routes.forEach(({ key }, i) => {
    if (previous[key]) {
      refs.current[key] = previous[key];
      return;
    }
    const entersFrom = i === index && previousIndex !== -1 && previousIndex !== i;
    const position = entersFrom ? (i > previousIndex ? 1 : -1) : i === index ? 0 : i >= index ? 1 : -1;
    refs.current[key] = new Animated.Value(position);
  });

  return refs.current;
}
