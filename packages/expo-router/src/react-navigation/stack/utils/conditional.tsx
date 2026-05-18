import { Animated } from 'react-native';

const { add, multiply } = Animated;

/**
 * Use an Animated Node based on a condition. Similar to Reanimated's `cond`.
 *
 * @param condition Animated Node representing the condition, must be 0 or 1, 1 means `true`, 0 means `false`
 * @param main Animated Node to use if the condition is `true`
 * @param fallback Animated Node to use if the condition is `false`
 */
export function conditional(
  condition: Animated.AnimatedInterpolation<0 | 1>,
  main: Animated.AnimatedInterpolation<number>,
  fallback: Animated.AnimatedInterpolation<number>
) {
  // To implement this behavior, we multiply the main node with the condition.
  // So if condition is 0, result will be 0, and if condition is 1, result will be main node.
  // Then we multiple reverse of the condition (0 if condition is 1) with the fallback.
  // So if condition is 0, result will be fallback node, and if condition is 1, result will be 0,
  // This way, one of them will always be 0, and other one will be the value we need.
  // In the end we add them both together, 0 + value we need = value we need
  return add(
    multiply(condition, main),
    multiply(
      condition.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      fallback
    )
  );
}
