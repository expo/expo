import type { LocaleDirection } from '../../native';
import type { GestureDirection, Layout } from '../types';
import { getInvertedMultiplier } from './getInvertedMultiplier';

/**
 * The distance of touch start from the edge of the screen where the gesture will be recognized
 */
const GESTURE_RESPONSE_DISTANCE_HORIZONTAL = 50;
const GESTURE_RESPONSE_DISTANCE_VERTICAL = 135;

export const gestureActivationCriteria = ({
  direction,
  gestureDirection,
  gestureResponseDistance,
  layout,
}: {
  direction: LocaleDirection;
  gestureDirection: GestureDirection;
  gestureResponseDistance?: number;
  layout: Layout;
}) => {
  const enableTrackpadTwoFingerGesture = true;

  const distance =
    gestureResponseDistance !== undefined
      ? gestureResponseDistance
      : gestureDirection === 'vertical' || gestureDirection === 'vertical-inverted'
        ? GESTURE_RESPONSE_DISTANCE_VERTICAL
        : GESTURE_RESPONSE_DISTANCE_HORIZONTAL;

  const failOffsetX: [number, number] = [-15, 15];
  const failOffsetY: [number, number] = [-20, 20];

  if (gestureDirection === 'vertical') {
    return {
      failOffsetX,
      activeOffsetY: 5,
      hitSlop: { bottom: -layout.height + distance },
      enableTrackpadTwoFingerGesture,
    };
  } else if (gestureDirection === 'vertical-inverted') {
    return {
      failOffsetX,
      activeOffsetY: -5,
      hitSlop: { top: -layout.height + distance },
      enableTrackpadTwoFingerGesture,
    };
  } else {
    const hitSlop = -layout.width + distance;
    const invertedMultiplier = getInvertedMultiplier(gestureDirection, direction === 'rtl');

    if (invertedMultiplier === 1) {
      return {
        activeOffsetX: 5,
        failOffsetY,
        hitSlop: { right: hitSlop },
        enableTrackpadTwoFingerGesture,
      };
    } else {
      return {
        activeOffsetX: -5,
        failOffsetY,
        hitSlop: { left: hitSlop },
        enableTrackpadTwoFingerGesture,
      };
    }
  }
};
