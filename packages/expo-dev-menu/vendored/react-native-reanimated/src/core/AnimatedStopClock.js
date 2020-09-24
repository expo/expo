import AnimatedNode from './AnimatedNode';
import AnimatedClock from './AnimatedClock';
import { AnimatedParam } from "./AnimatedParam";
import invariant from 'fbjs/lib/invariant';

class AnimatedStopClock extends AnimatedNode {
  _clockNode;

  constructor(clockNode) {
    invariant(
      clockNode instanceof AnimatedClock || clockNode instanceof AnimatedParam,
      `Reanimated: Animated.stopClock argument should be of type AnimatedClock but got ${clockNode}`
    );
    super({ type: 'clockStop', clock: clockNode });
    this._clockNode = clockNode;
  }

  toString() {
    return `AnimatedStopClock, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    this._clockNode.stop();
    return 0;
  }
}

export function createAnimatedStopClock(clock) {
  return new AnimatedStopClock(clock);
}
