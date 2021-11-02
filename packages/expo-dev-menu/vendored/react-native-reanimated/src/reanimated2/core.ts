/* global _WORKLET _getCurrentTime _frameTimestamp _eventTimestamp, _setGlobalConsole */
import NativeReanimated from './NativeReanimated';
import { Platform } from 'react-native';
import { nativeShouldBeMock, shouldBeUseWeb } from './PlatformChecker';
import {
  BasicWorkletFunction,
  WorkletFunction,
  ComplexWorkletFunction,
  SharedValue,
} from './commonTypes';
import {
  AnimationObject,
  PrimitiveValue,
  Timestamp,
} from './animation/commonTypes';
import { Descriptor } from './hook/commonTypes';

global.__reanimatedWorkletInit = function (worklet: WorkletFunction) {
  worklet.__worklet = true;
};

if (global._setGlobalConsole === undefined) {
  // it can happen when Reanimated plugin wasn't added, but the user uses the only API from version 1
  global._setGlobalConsole = () => {
    // noop
  };
}

export type ReanimatedConsole = Pick<
  Console,
  'debug' | 'log' | 'warn' | 'info' | 'error'
>;
interface WorkletValueSetterContext {
  _animation?: AnimationObject | null;
  _value?: PrimitiveValue | Descriptor;
  value?: PrimitiveValue;
  _setValue?: (val: PrimitiveValue | Descriptor) => void;
}

const testWorklet: BasicWorkletFunction<void> = () => {
  'worklet';
};

export const checkPluginState: (throwError: boolean) => boolean = (
  throwError = true
) => {
  if (!testWorklet.__workletHash && !shouldBeUseWeb()) {
    if (throwError) {
      throw new Error(
        "Reanimated 2 failed to create a worklet, maybe you forgot to add Reanimated's babel plugin?"
      );
    }
    return false;
  }
  return true;
};

export const isConfigured: (throwError?: boolean) => boolean = (
  throwError = false
) => {
  return checkPluginState(throwError) && !NativeReanimated.useOnlyV1;
};

export const isConfiguredCheck: () => void = () => {
  if (!isConfigured(true)) {
    throw new Error(
      'If you want to use Reanimated 2 then go through our installation steps https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation'
    );
  }
};

function _toArrayReanimated<T>(object: Iterable<T> | ArrayLike<T> | T[]): T[] {
  'worklet';
  if (Array.isArray(object)) {
    return object;
  }
  if (
    typeof Symbol !== 'undefined' &&
    (typeof Symbol === 'function' ? Symbol.iterator : '@@iterator') in
      Object(object)
  ) {
    return Array.from(object);
  }
  throw new Error(
    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
  );
}

function _mergeObjectsReanimated(): unknown {
  'worklet';
  // we can't use rest parameters in worklets at the moment
  // eslint-disable-next-line prefer-rest-params
  const arr = Array.from(arguments);
  return Object.assign.apply(null, [arr[0], ...arr.slice(1)]);
}

global.__reanimatedWorkletInit = function (worklet: WorkletFunction) {
  worklet.__worklet = true;

  if (worklet._closure) {
    const closure = worklet._closure;
    Object.keys(closure).forEach((key) => {
      if (key === '_toConsumableArray') {
        closure[key] = _toArrayReanimated;
      }

      if (key === '_objectSpread') {
        closure[key] = _mergeObjectsReanimated;
      }
    });
  }
};

function pushFrame(frame: (timestamp: Timestamp) => void): void {
  NativeReanimated.pushFrame(frame);
}

export function requestFrame(frame: (timestamp: Timestamp) => void): void {
  'worklet';
  if (NativeReanimated.native) {
    requestAnimationFrame(frame);
  } else {
    pushFrame(frame);
  }
}

global._WORKLET = false;
global._log = function (s: string) {
  console.log(s);
};

export function runOnUI<A extends any[], R>(
  worklet: ComplexWorkletFunction<A, R>
): (...args: A) => void {
  return makeShareable(worklet);
}

export function makeShareable<T>(value: T): T {
  isConfiguredCheck();
  return NativeReanimated.makeShareable(value);
}

export function getViewProp<T>(viewTag: string, propName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    return NativeReanimated.getViewProp(viewTag, propName, (result: T) => {
      if (typeof result === 'string' && result.substr(0, 6) === 'error:') {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}

let _getTimestamp: () => number;
if (nativeShouldBeMock()) {
  _getTimestamp = () => {
    return NativeReanimated.getTimestamp();
  };
} else {
  _getTimestamp = () => {
    'worklet';
    if (_frameTimestamp) {
      return _frameTimestamp;
    }
    if (_eventTimestamp) {
      return _eventTimestamp;
    }
    return _getCurrentTime();
  };
}

export function getTimestamp(): number {
  'worklet';
  if (Platform.OS === 'web') {
    return NativeReanimated.getTimestamp();
  }
  return _getTimestamp();
}

function workletValueSetter(
  this: WorkletValueSetterContext,
  value: (() => AnimationObject) | AnimationObject | PrimitiveValue | Descriptor
): void {
  'worklet';
  const previousAnimation = this._animation;
  if (previousAnimation) {
    previousAnimation.cancelled = true;
    this._animation = null;
  }
  if (
    typeof value === 'function' ||
    (value !== null &&
      typeof value === 'object' &&
      (value as AnimationObject).onFrame !== undefined)
  ) {
    const animation: AnimationObject =
      typeof value === 'function' ? value() : (value as AnimationObject);
    // prevent setting again to the same value
    // and triggering the mappers that treat this value as an input
    // this happens when the animation's target value(stored in animation.current until animation.onStart is called) is set to the same value as a current one(this._value)
    // built in animations that are not higher order(withTiming, withSpring) hold target value in .current
    if (this._value === animation.current && !animation.isHigherOrder) {
      animation.callback && animation.callback(true);
      return;
    }
    // animated set
    const initializeAnimation = (timestamp: number) => {
      animation.onStart(animation, this.value, timestamp, previousAnimation);
    };
    initializeAnimation(getTimestamp());
    const step = (timestamp: number) => {
      if (animation.cancelled) {
        animation.callback && animation.callback(false /* finished */);
        return;
      }
      const finished = animation.onFrame(animation, timestamp);
      animation.finished = true;
      animation.timestamp = timestamp;
      this._value = animation.current;
      if (finished) {
        animation.callback && animation.callback(true /* finished */);
      } else {
        requestAnimationFrame(step);
      }
    };

    this._animation = animation;

    if (_frameTimestamp) {
      // frame
      step(_frameTimestamp);
    } else {
      requestAnimationFrame(step);
    }
  } else {
    // prevent setting again to the same value
    // and triggering the mappers that treat this value as an input
    if (this._value === value) {
      return;
    }
    this._value = value as Descriptor | PrimitiveValue;
  }
}

// We cannot use pushFrame
// so we use own implementation for js
function workletValueSetterJS(
  this: WorkletValueSetterContext,
  value: (() => AnimationObject) | AnimationObject | PrimitiveValue | Descriptor
): void {
  const previousAnimation = this._animation;
  if (previousAnimation) {
    previousAnimation.cancelled = true;
    this._animation = null;
  }
  if (
    typeof value === 'function' ||
    (value !== null &&
      typeof value === 'object' &&
      (value as AnimationObject).onFrame)
  ) {
    // animated set
    const animation: AnimationObject =
      typeof value === 'function' ? value() : (value as AnimationObject);
    let initializeAnimation: ((timestamp: number) => void) | null = (
      timestamp: number
    ) => {
      animation.onStart(animation, this.value, timestamp, previousAnimation);
    };
    const step = (timestamp: number) => {
      if (animation.cancelled) {
        animation.callback && animation.callback(false /* finished */);
        return;
      }
      if (initializeAnimation) {
        initializeAnimation(timestamp);
        initializeAnimation = null; // prevent closure from keeping ref to previous animation
      }
      const finished = animation.onFrame(animation, timestamp);
      animation.timestamp = timestamp;
      this._setValue && this._setValue(animation.current as PrimitiveValue);
      if (finished) {
        animation.callback && animation.callback(true /* finished */);
      } else {
        requestFrame(step);
      }
    };

    this._animation = animation;

    requestFrame(step);
  } else {
    this._setValue && this._setValue(value as PrimitiveValue | Descriptor);
  }
}

export function makeMutable<T>(value: T): SharedValue<T> {
  isConfiguredCheck();
  return NativeReanimated.makeMutable(value);
}

export function makeRemote<T>(object = {}): T {
  isConfiguredCheck();
  return NativeReanimated.makeRemote(object);
}

export function startMapper(
  mapper: () => void,
  inputs: any[] = [],
  outputs: any[] = [],
  updater: () => void = () => {
    // noop
  },
  viewDescriptors: Descriptor[] | SharedValue<Descriptor[]> = []
): number {
  isConfiguredCheck();
  return NativeReanimated.startMapper(
    mapper,
    inputs,
    outputs,
    updater,
    viewDescriptors
  );
}

export function stopMapper(mapperId: number): void {
  NativeReanimated.stopMapper(mapperId);
}

export interface RunOnJSFunction<A extends any[], R> {
  __callAsync?: (...args: A) => void;
  (...args: A): R;
}

export function runOnJS<A extends any[], R>(
  fun: RunOnJSFunction<A, R>
): () => void {
  'worklet';
  if (!_WORKLET) {
    return fun;
  }
  if (!fun.__callAsync) {
    throw new Error(
      "Attempting to call runOnJS with an object that is not a host function. Using runOnJS is only possible with methods that are defined on the main React-Native Javascript thread and that aren't marked as worklets"
    );
  } else {
    return fun.__callAsync;
  }
}

if (!NativeReanimated.useOnlyV1) {
  NativeReanimated.installCoreFunctions(
    NativeReanimated.native ? workletValueSetter : workletValueSetterJS
  );

  const capturableConsole = console;
  isConfigured() &&
    runOnUI(() => {
      'worklet';
      const console = {
        debug: runOnJS(capturableConsole.debug),
        log: runOnJS(capturableConsole.log),
        warn: runOnJS(capturableConsole.warn),
        error: runOnJS(capturableConsole.error),
        info: runOnJS(capturableConsole.info),
      };
      _setGlobalConsole(console);
    })();
}
