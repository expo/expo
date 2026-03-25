import * as React from 'react';

import type { ParamListBase } from '../routers';
import type { NavigationContainerRef } from './types';

/**
 * Context which holds the route prop for a screen.
 */
export const NavigationContainerRefContext = React.createContext<
  NavigationContainerRef<ParamListBase> | undefined
>(undefined);
