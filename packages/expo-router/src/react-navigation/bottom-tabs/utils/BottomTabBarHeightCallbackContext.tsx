import * as React from 'react';

export const BottomTabBarHeightCallbackContext = React.createContext<
  ((height: number) => void) | undefined
>(undefined);
