import { cond, defined, set, add, min, max } from '../base';
import AnimatedValue from '../core/InternalAnimatedValue';
import diff from './diff';

export default function diffClamp(a, minVal, maxVal) {
  const value = new AnimatedValue();
  return set(
    value,
    min(max(add(cond(defined(value), value, a), diff(a)), minVal), maxVal)
  );
}
