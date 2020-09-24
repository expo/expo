import AnimatedNode from './AnimatedNode';

class AnimatedClockTest extends AnimatedNode {
  _clockNode;

  constructor(clockNode) {
    super({ type: 'clockTest', clock: clockNode });
    this._clockNode = clockNode;
  }

  toString() {
    return `AnimatedClockTest, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    return this._clockNode.isStarted() ? 1 : 0;
  }
}

export function createAnimatedClockTest(clock) {
  return new AnimatedClockTest(clock);
}
