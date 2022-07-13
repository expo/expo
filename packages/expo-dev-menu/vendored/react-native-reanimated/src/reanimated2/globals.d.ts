import { AnimatedStyle, StyleProps } from './commonTypes';
import { ReanimatedConsole } from './core';
import { MeasuredDimensions } from './NativeMethods';
import { NativeReanimated } from './NativeReanimated/NativeReanimated';
declare global {
  const _WORKLET: boolean;
  const _frameTimestamp: number;
  const _eventTimestamp: number;
  const _setGlobalConsole: (console?: ReanimatedConsole) => void;
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
  const ReanimatedDataMock: {
    now: () => number;
  };
  namespace NodeJS {
    interface Global {
      _setGlobalConsole: (console?: ReanimatedConsole) => void;
      _log: (s: string) => void;
      _setGestureState: () => void;
      _WORKLET: boolean;
      __reanimatedModuleProxy: NativeReanimated;
      _frameTimestamp: number | null;
      _measure: () => MeasuredDimensions;
      _scrollTo: () => void;
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
    }
  }
}
