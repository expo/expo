import type { NavigationAction } from '../routers';
import * as React from 'react';

export const UnhandledActionContext = React.createContext<
  ((action: NavigationAction) => void) | undefined
>(undefined);
