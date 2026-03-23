import type { GestureDirection } from '../types';

export function getInvertedMultiplier(
  gestureDirection: GestureDirection,
  isRTL: boolean
): 1 | -1 {
  switch (gestureDirection) {
    case 'vertical':
      return 1;
    case 'vertical-inverted':
      return -1;
    case 'horizontal':
      return isRTL ? -1 : 1;
    case 'horizontal-inverted':
      return isRTL ? 1 : -1;
  }
}
