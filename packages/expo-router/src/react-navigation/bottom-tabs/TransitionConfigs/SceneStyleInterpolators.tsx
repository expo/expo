import type {
  BottomTabSceneInterpolatedStyle,
  BottomTabSceneInterpolationProps,
} from '../types';

/**
 * Simple cross fade animation
 */
export function forFade({
  current,
}: BottomTabSceneInterpolationProps): BottomTabSceneInterpolatedStyle {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
    },
  };
}

/**
 * Animation where the screens slightly shift to left/right
 */
export function forShift({
  current,
}: BottomTabSceneInterpolationProps): BottomTabSceneInterpolatedStyle {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-50, 0, 50],
          }),
        },
      ],
    },
  };
}
