import * as React from 'react';

import type { NavigationAction } from '../routers';

export const UnhandledActionContext = React.createContext<
  ((action: NavigationAction) => void) | undefined
>(undefined);
