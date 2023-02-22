import { Component } from 'react';
import { measure } from './NativeMethods';
import { RefObjectFunction } from './hook/commonTypes';

export interface ComponentCoords {
  x: number;
  y: number;
}

/**
 * Given an absolute position and a component ref, returns the relative
 * position in the component's local coordinate space.
 */
export function getRelativeCoords(
  parentRef: RefObjectFunction<Component>,
  absoluteX: number,
  absoluteY: number
): ComponentCoords | null {
  'worklet';
  const parentCoords = measure(parentRef);
  if (parentCoords === null) {
    return null;
  }
  return {
    x: absoluteX - parentCoords.x,
    y: absoluteY - parentCoords.y,
  };
}
