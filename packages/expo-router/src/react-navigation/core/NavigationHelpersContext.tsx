import * as React from 'react';

import type { ParamListBase } from '../routers';
import type { NavigationHelpers } from './types';

/**
 * Context which holds the navigation helpers of the parent navigator.
 * Navigators should use this context in their view component.
 */
export const NavigationHelpersContext = React.createContext<
  NavigationHelpers<ParamListBase> | undefined
>(undefined);
