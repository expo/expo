'use client';
import * as React from 'react';

import type { NavigationState, PartialState } from '../routers';

export const NavigationStateContext = React.createContext<{
  isDefault?: true;
  state?: NavigationState | PartialState<NavigationState>;
  addOptionsGetter?: (key: string, getter: () => object | undefined | null) => void;
}>({
  isDefault: true,
});
