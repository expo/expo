import { installOnUIRuntime } from 'expo';
import { createSerializable, getUIRuntimeHolder } from 'react-native-worklets';

import WorkletsTesterModule from './WorkletsTesterModule';

export const WorkletsTester = {
  scheduleWorklet: (worklet: () => void) => {
    WorkletsTesterModule?.scheduleWorklet?.(createSerializable(worklet));
  },

  executeWorklet: (worklet: () => void) => {
    WorkletsTesterModule?.executeWorklet?.(createSerializable(worklet));
  },

  executeWorkletWithArgs: (worklet: (num: number, str: string, bool: boolean) => void) => {
    WorkletsTesterModule?.executeWorkletWithArgs?.(createSerializable(worklet));
  },

  scheduleWorkletWithArgs: (worklet: (num: number, str: string, bool: boolean) => void) => {
    WorkletsTesterModule?.scheduleWorkletWithArgs?.(createSerializable(worklet));
  },

  installUIRuntime() {
    installOnUIRuntime(getUIRuntimeHolder());
  },

  isUIRuntimeWorkOnMainThread(): Promise<boolean> {
    return WorkletsTesterModule!.isUIRuntimeWorkOnMainThread();
  },

  evaluateOnUIRuntime(source: string): Promise<string> {
    return WorkletsTesterModule!.evaluateOnUIRuntime(source);
  },

  createCounter() {
    return new WorkletsTesterModule!.WorkletsTesterCounter(0);
  },

  isAvailable() {
    return WorkletsTesterModule != null;
  },
};
