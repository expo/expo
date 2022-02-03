import AnimatedNode from './AnimatedNode';
import { val } from '../val';
import ReanimatedModule from '../../ReanimatedModule';
import invariant from 'invariant';

function sanitizeValue(value) {
  return value === null || value === undefined || typeof value === 'string'
    ? value
    : Number(value);
}

const CONSTANT_VALUES = new Map();

function initializeConstantValues() {
  if (CONSTANT_VALUES.size !== 0) {
    return;
  }
  [0, -1, 1, -2, 2].forEach((v) =>
    CONSTANT_VALUES.set(v, new InternalAnimatedValue(v, true))
  );
}

/**
 * This class has been made internal in order to omit dependencies' cycles which
 * were caused by imperative setValue and interpolate – they are currently exposed with AnimatedValue.js
 */
export default class InternalAnimatedValue extends AnimatedNode {
  static valueForConstant(number) {
    initializeConstantValues();
    return (
      CONSTANT_VALUES.get(number) || new InternalAnimatedValue(number, true)
    );
  }

  constructor(value, constant = false) {
    invariant(value !== null, 'Animated.Value cannot be set to the null');
    super({ type: 'value', value: sanitizeValue(value) });
    this._startingValue = this._value = value;
    this._animation = null;
    this._constant = constant;
  }

  __detach() {
    if (!this._constant) {
      if (ReanimatedModule.getValue) {
        ReanimatedModule.getValue(
          this.__nodeID,
          (val) => (this.__nodeConfig.value = val)
        );
      } else {
        this.__nodeConfig.value = this.__getValue();
      }
    }
    this.__detachAnimation(this._animation);
    super.__detach();
  }

  __detachAnimation(animation) {
    animation && animation.__detach();
    if (this._animation === animation) {
      this._animation = null;
    }
  }

  __attachAnimation(animation) {
    this.__detachAnimation(this._animation);
    this._animation = animation;
  }

  __onEvaluate() {
    if (this.__inputNodes && this.__inputNodes.length) {
      this.__inputNodes.forEach(val);
    }
    return this._value;
  }

  // AnimatedValue will override this method to modify the value of a native node.
  setValue(value) {
    this.__detachAnimation(this._animation);
    this._updateValue(value);
  }

  _updateValue(value) {
    this._value = value;
    this.__forceUpdateCache(value);
  }
}
