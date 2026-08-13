import {
  render as renderWithoutStore,
  renderHook as renderHookWithoutStore,
} from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { storeRef } from '../../../global-state/store';
import { StoreContext, type StoreContextValue } from '../../../global-state/storeContext';

function EmptyScreen() {
  return null;
}

export const storeValue: StoreContextValue = {
  get navigationRef() {
    return storeRef.current.navigationRef;
  },
  linking: undefined,
  get state() {
    return storeRef.current.state;
  },
  rootComponent: EmptyScreen,
  get routeNode() {
    return storeRef.current.routeNode;
  },
  redirects: [],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>;
}

export function render(element: ReactElement): ReturnType<typeof renderWithoutStore> {
  return renderWithoutStore(element, { wrapper: StoreProvider });
}

export function renderHook<Result>(callback: () => Result) {
  return renderHookWithoutStore(callback, { wrapper: StoreProvider });
}
