import AnimatedNode, { getCallID, setCallID } from './AnimatedNode';
import { adapt } from './AnimatedBlock';
import { val } from '../val';
import invariant from 'fbjs/lib/invariant';

class AnimatedCallFunc extends AnimatedNode {
  _previousCallID;
  _what;
  _args;
  _params;
  constructor(what, args, params) {
    invariant(
      what instanceof AnimatedNode,
      `Reanimated: AnimatedCallFunc 'what' argument should be of type AnimatedNode but got ${what}`
    );
    invariant(
      args.every(el => el instanceof AnimatedNode),
      `Reanimated: every AnimatedCallFunc 'args' argument should be of type AnimatedNode but got ${args}`
    );
    invariant(
      params.every(el => el instanceof AnimatedNode),
      `Reanimated: every AnimatedCallFunc 'params' argument should be of type AnimatedNode but got ${params}`
    );
    super(
      {
        type: 'callfunc',
        what,
        args,
        params,
      },
      [...args]
    );
    this._what = what;
    this._args = args;
    this._params = params;
  }

  toString() {
    return `AnimatedCallFunc, id: ${this.__nodeID}`;
  }

  beginContext() {
    this._previousCallID = getCallID();
    setCallID(getCallID() + '/' + this.__nodeID);

    this._params.forEach((param, index) => {
      param.beginContext(this._args[index], this._previousCallID);
    });
  }

  endContext() {
    this._params.forEach((param, index) => {
      param.endContext();
    });
    setCallID(this._previousCallID);
  }

  __onEvaluate() {
    this.beginContext();
    const value = val(this._what);
    this.endContext();
    return value;
  }
}

export function createAnimatedCallFunc(proc, args, params) {
  return new AnimatedCallFunc(proc, args.map(p => adapt(p)), params);
}
