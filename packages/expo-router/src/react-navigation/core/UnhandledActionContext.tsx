import type { NavigationAction } from '@react-navigation/routers';
import * as React from 'react';

export const UnhandledActionContext = React.createContext<
  ((action: NavigationAction) => void) | undefined
>(undefined);
