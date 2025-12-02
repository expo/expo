import { createContext } from 'react';

export const ZoomTransitionSourceContext = createContext<
  | {
      identifier: string;
    }
  | undefined
>(undefined);
