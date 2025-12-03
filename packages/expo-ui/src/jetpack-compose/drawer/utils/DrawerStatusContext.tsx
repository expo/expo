import type { DrawerStatus } from '@react-navigation/native';
import * as React from 'react';

export const DrawerStatusContext = React.createContext<
  DrawerStatus | undefined
>(undefined);
