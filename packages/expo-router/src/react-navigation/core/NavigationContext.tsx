import type { ParamListBase } from '../routers';
import * as React from 'react';

import type { NavigationProp } from './types';
/**
 * Context which holds the navigation prop for a screen.
 */
export const NavigationContext = React.createContext<
  NavigationProp<ParamListBase> | undefined
>(undefined);
