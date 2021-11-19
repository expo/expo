import { block, cond, defined, neq, not, set, proc } from '../base';
import AnimatedValue from '../core/InternalAnimatedValue';

const procOnChange = proc(function (value, action, prevValue) {
  return block([
    cond(not(defined(prevValue)), set(prevValue, value)),
    cond(neq(value, prevValue), [set(prevValue, value), action]),
  ]);
});

export default function onChange(value, action) {
  const prevValue = new AnimatedValue();
  return procOnChange(value, action, prevValue);
}
