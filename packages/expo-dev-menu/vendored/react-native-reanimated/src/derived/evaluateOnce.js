import AnimatedValue from '../core/InternalAnimatedValue';
import { createAnimatedSet as set } from '../core/AnimatedSet';
import { createAnimatedCall as call } from '../core/AnimatedCall';
import { createAnimatedAlways as always } from '../core/AnimatedAlways';
import { createAnimatedCond as cond } from '../core/AnimatedCond';

/**
 * evaluate given node and notify children
 * @param node - node to be evaluated
 * @param input - nodes (or one node) representing values which states input for node.
 * @param callback - after callback
 */

export function evaluateOnce(node, input = [], callback) {
  if (!Array.isArray(input)) {
    input = [input];
  }
  const done = new AnimatedValue(0);
  const evalNode = cond(
    done,
    0,
    call([node, set(done, 1)], () => {
      callback && callback();
      for (let i = 0; i < input.length; i++) {
        input[i].__removeChild(alwaysNode);
        alwaysNode.__detach();
      }
    })
  );
  const alwaysNode = always(evalNode);
  for (let i = 0; i < input.length; i++) {
    input[i].__addChild(alwaysNode);
    alwaysNode.__attach();
  }
}
