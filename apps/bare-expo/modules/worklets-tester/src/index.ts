import { createSerializable } from 'react-native-worklets';

import WorkletsTesterModule from './WorkletsTesterModule';

export const WorkletsTester = {
  scheduleWorklet: (worklet: () => void) => {
    WorkletsTesterModule?.scheduleWorklet?.(createSerializable(worklet));
  },

  executeWorklet: (worklet: () => void) => {
    WorkletsTesterModule?.executeWorklet?.(createSerializable(worklet));
  },
};
