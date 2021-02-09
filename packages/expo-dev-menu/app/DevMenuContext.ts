import React from 'react';

import { DevMenuItemAnyType } from './DevMenuInternal';

export type Context = {
  expand?: () => any;
  collapse?: () => any;

  appInfo?: { [key: string]: any };
  uuid?: string;
  devMenuItems?: DevMenuItemAnyType[];
  enableDevelopmentTools?: boolean;
  showOnboardingView?: boolean;
};

const DevMenuContext = React.createContext<Context | null>(null);
DevMenuContext.displayName = 'DevMenuContext';

export default DevMenuContext;
