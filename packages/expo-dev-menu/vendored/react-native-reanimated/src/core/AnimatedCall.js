import invariant from 'fbjs/lib/invariant';
import ReanimatedEventEmitter from '../ReanimatedEventEmitter';
import { val } from '../val';
import AnimatedNode from './AnimatedNode';

const NODE_MAPPING = new Map();

function listener(data) {
  const node = NODE_MAPPING.get(data.id);
  node && node._callback(data.args);
}

class AnimatedCall extends AnimatedNode {
  _callback;
  _args;

  constructor(args, jsFunction) {
    invariant(
      args.every(el => el instanceof AnimatedNode),
      `Reanimated: Animated.call node args should be an array with elements of type AnimatedNode. One or more of them are not AnimatedNodes`
    );
    super({ type: 'call', input: args }, args);
    this._callback = jsFunction;
    this._args = args;
  }

  toString() {
    return `AnimatedCall, id: ${this.__nodeID}`;
  }

  __attach() {
    super.__attach();
    NODE_MAPPING.set(this.__nodeID, this);
    if (NODE_MAPPING.size === 1) {
      ReanimatedEventEmitter.addListener('onReanimatedCall', listener);
    }
  }

  __detach() {
    NODE_MAPPING.delete(this.__nodeID);
    if (NODE_MAPPING.size === 0) {
      ReanimatedEventEmitter.removeAllListeners('onReanimatedCall');
    }
    super.__detach();
  }

  __onEvaluate() {
    this._callback(this._args.map(val));
    return 0;
  }
}

export function createAnimatedCall(args, func) {
  return new AnimatedCall(args, func);
}
