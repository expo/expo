import React from 'react';

import { DevMenuItemAnyType } from './DevMenuInternal';

type Session = {
  sessionSecret: string;
};

export type Context = {
  expand?: () => any;
  collapse?: () => any;
  setSession: (session: Session) => Promise<void>;

  appInfo?: { [key: string]: any };
  uuid?: string;
  devMenuItems?: DevMenuItemAnyType[];
  enableDevelopmentTools?: boolean;
  showOnboardingView?: boolean;
  isAuthenticated: boolean;
};

const DevMenuContext = React.createContext<Context | null>(null);
DevMenuContext.displayName = 'DevMenuContext';

export default DevMenuContext;
