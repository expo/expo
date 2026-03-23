import type { ParamListBase } from '@react-navigation/routers';
import * as React from 'react';

import type { NavigationHelpers } from './types';

/**
 * Context which holds the navigation helpers of the parent navigator.
 * Navigators should use this context in their view component.
 */
export const NavigationHelpersContext = React.createContext<
  NavigationHelpers<ParamListBase> | undefined
>(undefined);
