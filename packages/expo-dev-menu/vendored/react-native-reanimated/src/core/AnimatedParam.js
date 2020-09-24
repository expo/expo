import invariant from 'fbjs/lib/invariant';
import AnimatedNode, { getCallID, setCallID } from './AnimatedNode';
import AnimatedClock from './AnimatedClock';
import { val } from '../val';

export class AnimatedParam extends AnimatedNode {
  argsStack = [];
  _prevCallID;
  
  constructor() {
    super({ type: 'param' }, []);
    this.__attach();
  }

  beginContext(ref, prevCallID) {
    this._prevCallID = prevCallID;
    this.argsStack.push(ref);
  }

  endContext() {
    this.argsStack.pop();
  }

  _getTopNode() {
    if (this.argsStack.length === 0) throw new Error(`param: Invocation failed because argsStack is empty`);
    const top = this.argsStack[this.argsStack.length - 1];
    return top;
  }

  setValue(value) {
    const top = this._getTopNode();
    if (top.setValue) {
      const callID = getCallID();
      setCallID(this._prevCallID);
      top.setValue(value);
      setCallID(callID);
    } else {
      throw new Error(`param: setValue(${value}) failed because the top element has no known method for updating it's current value.`)
    }
  }
  
  __onEvaluate() {
    const callID = getCallID();
    setCallID(this._prevCallID);
    const top = this._getTopNode();
    const value = val(top);
    setCallID(callID);
    return value;
  }

  start() {
    const node = this._getTopNode();
    invariant(
      node instanceof AnimatedClock || node instanceof AnimatedParam,
      `param: top node should be of type AnimatedClock but got ${node}`
    );
    node.start();
  }

  stop() {
    const node = this._getTopNode();
    invariant(
      node instanceof AnimatedClock || node instanceof AnimatedParam,
      `param: top node should be of type AnimatedClock but got ${node}`
    );
    node.stop();
  }

  isRunning() {
    const node = this._getTopNode();

    if (node instanceof AnimatedParam) {
      return node.isRunning()
    }
    invariant(
      node instanceof AnimatedClock,
      `param: top node should be of type AnimatedClock but got ${node}`
    );
    return node.isStarted();
  }
}

export function createAnimatedParam() {
  return new AnimatedParam();
}
