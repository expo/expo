import invariant from 'fbjs/lib/invariant';
import { val } from '../val';
import AnimatedNode from './AnimatedNode';
import InternalAnimatedValue from './InternalAnimatedValue';

class AnimatedBlock extends AnimatedNode {
  _array;

  constructor(array) {
    invariant(
      array.every(el => el instanceof AnimatedNode),
      `Reanimated: Animated.block node argument should be an array with elements of type AnimatedNode. One or more of them are not AnimatedNodes`
    );
    super({ type: 'block', block: array }, array);
    this._array = array;
  }

  toString() {
    return `AnimatedBlock, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    let result;
    this._array.forEach(node => {
      result = val(node);
    });
    return result;
  }
}

export function createAnimatedBlock(items) {
  return adapt(items);
}

function nodify(v) {
  if (typeof v === 'object' && v?.__isProxy) {
    if (!v.__val) {
      v.__val = new InternalAnimatedValue(0);
    }
    return v.__val;
  }
  // TODO: cache some typical static values (e.g. 0, 1, -1)
  return v instanceof AnimatedNode
    ? v
    : InternalAnimatedValue.valueForConstant(v);
}

export function adapt(v) {
  return Array.isArray(v)
    ? new AnimatedBlock(v.map(node => adapt(node)))
    : nodify(v);
}
