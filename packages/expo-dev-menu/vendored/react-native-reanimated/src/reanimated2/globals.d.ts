import type {
  AnimatedStyle,
  StyleProps,
  MeasuredDimensions,
} from './commonTypes';
import type { ReanimatedConsole } from './core';
import type { NativeReanimated } from './NativeReanimated/NativeReanimated';
import type { FrameCallbackRegistryUI } from './frameCallback/FrameCallbackRegistryUI';

declare global {
  const _WORKLET: boolean;
  const _REANIMATED_VERSION_CPP: string;
  const _frameTimestamp: number | null;
  const _eventTimestamp: number;
  const __reanimatedModuleProxy: NativeReanimated;
  const _setGlobalConsole: (console?: ReanimatedConsole) => void;
  const _log: (s: string) => void;
  const _getCurrentTime: () => number;
  const _stopObservingProgress: (tag: number, flag: boolean) => void;
  const _startObservingProgress: (
    tag: number,
    flag: { value: boolean; _value: boolean }
  ) => void;
  const _setGestureState: (handlerTag: number, newState: number) => void;
  const _updateProps: (
    tag: number,
    name: string,
    updates: StyleProps | AnimatedStyle
  ) => void;
  const _measure: (viewTag: number) => MeasuredDimensions;
  const _scrollTo: (
    viewTag: number,
    x: number,
    y: number,
    animated: boolean
  ) => void;
  const _chronoNow: () => number;
  const performance: { now: () => number };
  const LayoutAnimationRepository: {
    configs: Record<string, unknown>;
    registerConfig(tag: number, config: Record<string, unknown>): void;
    removeConfig(tag: number): void;
    startAnimationForTag(tag: number, type: string, yogaValues: unknown): void;
  };
  const ReanimatedDataMock: {
    now: () => number;
  };
  const _frameCallbackRegistry: FrameCallbackRegistryUI;
  namespace NodeJS {
    interface Global {
      _WORKLET: boolean;
      _IS_FABRIC: boolean;
      _REANIMATED_VERSION_CPP: string;
      _frameTimestamp: number | null;
      _eventTimestamp: number;
      __reanimatedModuleProxy: NativeReanimated;
      _setGlobalConsole: (console?: ReanimatedConsole) => void;
      _log: (s: string) => void;
      _getCurrentTime: () => number;
      _stopObservingProgress: (tag: number, flag: boolean) => void;
      _startObservingProgress: (
        tag: number,
        flag: { value: boolean; _value: boolean }
      ) => void;
      _setGestureState: (handlerTag: number, newState: number) => void;
      _measure: (viewTag: number) => MeasuredDimensions;
      _scrollTo: (
        viewTag: number,
        x: number,
        y: number,
        animated: boolean
      ) => void;
      _chronoNow: () => number;
      performance: { now: () => number };
      LayoutAnimationRepository: {
        configs: Record<string, unknown>;
        registerConfig(tag: number, config: Record<string, unknown>): void;
        removeConfig(tag: number): void;
        startAnimationForTag(
          tag: number,
          type: string,
          yogaValues: unknown
        ): void;
      };
      ReanimatedDataMock: {
        now: () => number;
      };
      _frameCallbackRegistry: FrameCallbackRegistryUI;
    }
  }
}
