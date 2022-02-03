import { processColor } from 'react-native';
import { round } from '../base';
import color from './color';
import interpolate, { Extrapolate } from './interpolate';

function red(c) {
  return (c >> 16) & 255;
}
function green(c) {
  return (c >> 8) & 255;
}
function blue(c) {
  return c & 255;
}
function opacity(c) {
  return ((c >> 24) & 255) / 255;
}

/**
 * Use this if you want to interpolate an `Animated.Value` into color values.
 *
 * #### Why is this needed?
 *
 * Unfortunately, if you'll pass color values directly into the `outputRange` option
 * of `interpolate()` function, that won't really work (at least at the moment).
 * See https://github.com/software-mansion/react-native-reanimated/issues/181 .
 *
 * So, for now you can just use this helper instead.
 */
export default function interpolateColors(animationValue, options) {
  const { inputRange, outputColorRange } = options;
  const colors = outputColorRange.map(processColor);

  const r = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(red),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  const g = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(green),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  const b = round(
    interpolate(animationValue, {
      inputRange,
      outputRange: colors.map(blue),
      extrapolate: Extrapolate.CLAMP,
    })
  );
  const a = interpolate(animationValue, {
    inputRange,
    outputRange: colors.map(opacity),
    extrapolate: Extrapolate.CLAMP,
  });

  return color(r, g, b, a);
}
