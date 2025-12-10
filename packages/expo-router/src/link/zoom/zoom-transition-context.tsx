'use client';

import { createContext } from 'react';

export type ZoomTransitionSourceContextValueType =
  | {
      identifier: string;
      hasZoomSource: boolean;
      addSource: () => void;
      removeSource: () => void;
    }
  | undefined;

export const ZoomTransitionSourceContext =
  createContext<ZoomTransitionSourceContextValueType>(undefined);

export interface ZoomTransitionTargetContextValueType {
  identifier: string | null;
}

export const ZoomTransitionTargetContext = createContext<ZoomTransitionTargetContextValueType>({
  identifier: null,
});
