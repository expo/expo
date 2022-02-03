import { WorkletFunction } from './commonTypes';
import { ReanimatedConsole } from './core';
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
  namespace NodeJS {
    interface Global {
      __reanimatedWorkletInit: (worklet: WorkletFunction) => void;
      _setGlobalConsole: (console?: ReanimatedConsole) => void;
      _log: (s: string) => void;
      _WORKLET: boolean;
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
    }
  }
}
