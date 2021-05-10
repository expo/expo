import AnimatedNode from './AnimatedNode';
import invariant from 'fbjs/lib/invariant';
import { val } from '../val';

class AnimatedAlways extends AnimatedNode {
  _what;

  constructor(what) {
    invariant(
      what instanceof AnimatedNode,
      `Reanimated: Animated.always node argument should be of type AnimatedNode but got ${what}`
    );
    super({ type: 'always', what }, [what]);
    this._what = what;
  }

  toString() {
    return `AnimatedAlways, id: ${this.__nodeID}`;
  }

  update() {
    this.__getValue();
  }

  __onEvaluate() {
    val(this._what);
    return 0;
  }
}

export function createAnimatedAlways(item) {
  return new AnimatedAlways(item);
}
