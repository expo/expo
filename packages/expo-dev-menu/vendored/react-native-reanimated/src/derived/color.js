import { Platform } from 'react-native';

import { add, cond, concat, lessThan, multiply, round, sub, proc } from '../base';
import AnimatedNode from '../core/AnimatedNode';

const procColor = proc(function(r, g, b, a) {
  const color = add(
    multiply(a, 1 << 24),
    multiply(round(r), 1 << 16),
    multiply(round(g), 1 << 8),
    round(b)
  );
  
  if (Platform.OS === 'android') {
    // on Android color is represented as signed 32 bit int
    return cond(
      lessThan(color, (1 << 31) >>> 0),
      color,
      sub(color, Math.pow(2, 32))
    );
  }
  return color;
});

export default function color(r, g, b, a = 1) {
  if (Platform.OS === 'web') {
    // doesn't support bit shifting
    return concat('rgba(', r, ',', g, ',', b, ',', a, ')');
  }

  if (a instanceof AnimatedNode) {
    a = round(multiply(a, 255));
  } else {
    a = Math.round(a * 255);
  }

  return procColor(r, g, b, a);
}
