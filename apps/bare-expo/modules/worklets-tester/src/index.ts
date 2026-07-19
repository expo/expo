import { createSerializable } from 'react-native-worklets';

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

  isAvailable() {
    return WorkletsTesterModule != null;
  },
};
