import AnimatedNode from './AnimatedNode';
import AnimatedClock from './AnimatedClock';
import { AnimatedParam } from './AnimatedParam';
import invariant from 'invariant';

class AnimatedStartClock extends AnimatedNode {
  _clockNode;

  constructor(clockNode) {
    invariant(
      clockNode instanceof AnimatedClock || clockNode instanceof AnimatedParam,
      `Reanimated: Animated.startClock argument should be of type AnimatedClock but got ${clockNode}`
    );
    super({ type: 'clockStart', clock: clockNode });
    this._clockNode = clockNode;
  }

  toString() {
    return `AnimatedStartClock, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    this._clockNode.start();
    return 0;
  }
}

export function createAnimatedStartClock(clock) {
  return new AnimatedStartClock(clock);
}
