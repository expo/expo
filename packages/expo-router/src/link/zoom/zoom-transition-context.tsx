import { createContext } from 'react';

export type ZoomTransitionSourceContextValueType =
  | {
      identifier: string;
      addSource: () => void;
      removeSource: () => void;
    }
  | undefined;

export const ZoomTransitionSourceContext =
  createContext<ZoomTransitionSourceContextValueType>(undefined);
