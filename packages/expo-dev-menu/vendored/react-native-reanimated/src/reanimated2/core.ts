/* global _WORKLET _getCurrentTime _frameTimestamp _eventTimestamp, _setGlobalConsole */
import NativeReanimatedModule from './NativeReanimated';
import { Platform } from 'react-native';
import { nativeShouldBeMock, shouldBeUseWeb, isWeb } from './PlatformChecker';
import {
  BasicWorkletFunction,
  ComplexWorkletFunction,
  SharedValue,
  AnimationObject,
  AnimatableValue,
  Timestamp,
} from './commonTypes';
import { Descriptor } from './hook/commonTypes';
import JSReanimated from './js-reanimated/JSReanimated';

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

export type WorkletValue =
  | (() => AnimationObject)
  | AnimationObject
  | AnimatableValue
  | Descriptor;
interface WorkletValueSetterContext {
  _animation?: AnimationObject | null;
  _value?: AnimatableValue | Descriptor;
  value?: AnimatableValue;
  _setValue?: (val: AnimatableValue | Descriptor) => void;
}

const testWorklet: BasicWorkletFunction<void> = () => {
  'worklet';
};

const throwUninitializedReanimatedException = () => {
  throw new Error(
    "Failed to initialize react-native-reanimated library, make sure you followed installation steps here: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/ \n1) Make sure reanimated's babel plugin is installed in your babel.config.js (you should have 'react-native-reanimated/plugin' listed there - also see the above link for details) \n2) Make sure you reset build cache after updating the config, run: yarn start --reset-cache"
  );
};

export const checkPluginState: (throwError: boolean) => boolean = (
  throwError = true
) => {
  if (!testWorklet.__workletHash && !shouldBeUseWeb()) {
    if (throwError) {
      throwUninitializedReanimatedException();
    }
    return false;
  }
  return true;
};

export const isConfigured: (throwError?: boolean) => boolean = (
  throwError = false
) => {
  return checkPluginState(throwError);
};

export const isConfiguredCheck: () => void = () => {
  checkPluginState(true);
};

function pushFrame(frame: (timestamp: Timestamp) => void): void {
  (NativeReanimatedModule as JSReanimated).pushFrame(frame);
}

export function requestFrame(frame: (timestamp: Timestamp) => void): void {
  'worklet';
  if (NativeReanimatedModule.native) {
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
  return NativeReanimatedModule.makeShareable(value);
}

export function getViewProp<T>(viewTag: string, propName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    return NativeReanimatedModule.getViewProp(
      viewTag,
      propName,
      (result: T) => {
        if (typeof result === 'string' && result.substr(0, 6) === 'error:') {
          reject(result);
        } else {
          resolve(result);
        }
      }
    );
  });
}

let _getTimestamp: () => number;
if (nativeShouldBeMock()) {
  _getTimestamp = () => {
    return (NativeReanimatedModule as JSReanimated).getTimestamp();
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
    return (NativeReanimatedModule as JSReanimated).getTimestamp();
  }
  return _getTimestamp();
}

function workletValueSetter<T extends WorkletValue>(
  this: WorkletValueSetterContext,
  value: T
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
      typeof value === 'function'
        ? (value as () => AnimationObject)()
        : (value as AnimationObject);
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
    this._value = value as Descriptor | AnimatableValue;
  }
}

// We cannot use pushFrame
// so we use own implementation for js
function workletValueSetterJS<T extends WorkletValue>(
  this: WorkletValueSetterContext,
  value: T
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
      typeof value === 'function'
        ? (value as () => AnimationObject)()
        : (value as AnimationObject);
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
      this._setValue && this._setValue(animation.current as AnimatableValue);
      if (finished) {
        animation.callback && animation.callback(true /* finished */);
      } else {
        requestFrame(step);
      }
    };

    this._animation = animation;

    requestFrame(step);
  } else {
    this._setValue && this._setValue(value as AnimatableValue | Descriptor);
  }
}

export function makeMutable<T>(value: T): SharedValue<T> {
  isConfiguredCheck();
  return NativeReanimatedModule.makeMutable(value);
}

export function makeRemote<T>(object = {}): T {
  isConfiguredCheck();
  return NativeReanimatedModule.makeRemote(object);
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
  return NativeReanimatedModule.startMapper(
    mapper,
    inputs,
    outputs,
    updater,
    viewDescriptors
  );
}

export function stopMapper(mapperId: number): void {
  NativeReanimatedModule.stopMapper(mapperId);
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

NativeReanimatedModule.installCoreFunctions(
  NativeReanimatedModule.native
    ? (workletValueSetter as <T>(value: T) => void)
    : (workletValueSetterJS as <T>(value: T) => void)
);

if (!isWeb() && isConfigured()) {
  const capturableConsole = console;
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

type FeaturesConfig = {
  enableLayoutAnimations: boolean;
  setByUser: boolean;
};

let featuresConfig: FeaturesConfig = {
  enableLayoutAnimations: false,
  setByUser: false,
};

export function enableLayoutAnimations(
  flag: boolean,
  isCallByUser = true
): void {
  if (isCallByUser) {
    featuresConfig = {
      enableLayoutAnimations: flag,
      setByUser: true,
    };
    NativeReanimatedModule.enableLayoutAnimations(flag);
  } else if (
    !featuresConfig.setByUser &&
    featuresConfig.enableLayoutAnimations !== flag
  ) {
    featuresConfig.enableLayoutAnimations = flag;
    NativeReanimatedModule.enableLayoutAnimations(flag);
  }
}

export function configureProps(uiProps: string[], nativeProps: string[]): void {
  if (!nativeShouldBeMock()) {
    NativeReanimatedModule.configureProps(uiProps, nativeProps);
  }
}

export function jestResetJsReanimatedModule() {
  (NativeReanimatedModule as JSReanimated).jestResetModule();
}
