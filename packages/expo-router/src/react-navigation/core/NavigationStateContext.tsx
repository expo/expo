import type { NavigationState, PartialState } from '@react-navigation/routers';
import * as React from 'react';

const MISSING_CONTEXT_ERROR =
  "Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.";

export const NavigationStateContext = React.createContext<{
  isDefault?: true;
  state?: NavigationState | PartialState<NavigationState>;
  getKey: () => string | undefined;
  setKey: (key: string) => void;
  getState: () => NavigationState | PartialState<NavigationState> | undefined;
  setState: (
    state: NavigationState | PartialState<NavigationState> | undefined
  ) => void;
  getIsInitial: () => boolean;
  addOptionsGetter?: (
    key: string,
    getter: () => object | undefined | null
  ) => void;
}>({
  isDefault: true,

  get getKey(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get setKey(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get getState(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get setState(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get getIsInitial(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
});
