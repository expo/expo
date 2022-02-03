import invariant from 'invariant';
import { NativeModules } from 'react-native';
import { val } from '../val';
import { adapt, createAnimatedBlock as block } from './AnimatedBlock';
import { createAnimatedCall as call } from './AnimatedCall';
import AnimatedNode from './AnimatedNode';

class AnimatedDebug extends AnimatedNode {
  _message;
  _value;

  constructor(message, value) {
    invariant(
      typeof message === 'string',
      `Reanimated: Animated.debug node first argument should be of type string but got ${message}`
    );
    invariant(
      value instanceof AnimatedNode,
      `Reanimated: Animated.debug node second argument should be of type AnimatedNode but got ${value}`
    );
    super({ type: 'debug', message, value }, [value]);
    this._message = message;
    this._value = value;
  }

  toString() {
    return `AnimatedDebug, id: ${this.__nodeID}`;
  }

  __onEvaluate() {
    const value = val(this._value);
    console.log(this._message, value);
    return value;
  }
}

export function createAnimatedDebug(message, value) {
  if (__DEV__) {
    // hack to detect if app is running in remote debugger
    // https://stackoverflow.com/questions/39022216
    const runningInRemoteDebugger = typeof atob !== 'undefined';

    // read the executionEnvironment off of expo-constants without explicitly
    // depending on the package
    const runningInExpoShell =
      NativeModules.NativeUnimoduleProxy?.modulesConstants?.ExponentConstants
        ?.executionEnvironment === 'storeClient';

    if (runningInRemoteDebugger || runningInExpoShell) {
      // When running in expo or remote debugger we use JS console.log to output variables
      // otherwise we output to the native console using native debug node
      return block([
        call([value], ([a]) => console.log(`${message} ${a}`)),
        value,
      ]);
    } else {
      return new AnimatedDebug(message, adapt(value));
    }
  }
  // Debugging is disabled in PROD
  return value;
}
