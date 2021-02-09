import invariant from 'fbjs/lib/invariant';
import { adapt } from '../core/AnimatedBlock';
import AnimatedNode from './AnimatedNode';
import { val } from '../val';

class AnimatedConcat extends AnimatedNode {
  constructor(input) {
    invariant(
      input.every(
        el =>
          el instanceof AnimatedNode ||
          typeof el === 'number' ||
          typeof el === 'string'
      ),
      `Reanimated: Animated.concat node arguments should be of type AnimatedNode or String or Number. One or more of them are not of that type. Node: ${input}`
    );
    super({ type: 'concat', input }, input);
    this._input = input;
  }

  __onEvaluate() {
    return this._input.reduce((prev, current) => prev + val(current), '');
  }

  toString() {
    return `AnimatedConcat, id: ${this.__nodeID}`;
  }
}

export function createAnimatedConcat(...args) {
  return new AnimatedConcat(args.map(adapt));
}
