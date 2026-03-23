import type { DrawerStatus } from '../../native';
import * as React from 'react';

export const DrawerStatusContext = React.createContext<
  DrawerStatus | undefined
>(undefined);
