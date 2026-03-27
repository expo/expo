import type { GestureDirection, Layout } from '../types';
import { getInvertedMultiplier } from './getInvertedMultiplier';

export function getDistanceForDirection(
  layout: Layout,
  gestureDirection: GestureDirection,
  isRTL: boolean
): number {
  const multiplier = getInvertedMultiplier(gestureDirection, isRTL);

  switch (gestureDirection) {
    case 'vertical':
    case 'vertical-inverted':
      return layout.height * multiplier;
    case 'horizontal':
    case 'horizontal-inverted':
      return layout.width * multiplier;
  }
}
