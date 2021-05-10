import { cond, block, defined, sub, set, proc } from '../base';
import AnimatedValue from '../core/InternalAnimatedValue';

const procDiff = proc(function(v, stash, prev) {
  return block([
    set(stash, cond(defined(prev), sub(v, prev), 0)),
    set(prev, v),
    stash,
  ]);
});

export default function diff(v) {
  const stash = new AnimatedValue(0);
  const prev = new AnimatedValue();
  return procDiff(v, stash, prev);
}
