import * as React from 'react';

import type { DrawerStatus } from '../../native';

export const DrawerStatusContext = React.createContext<DrawerStatus | undefined>(undefined);
