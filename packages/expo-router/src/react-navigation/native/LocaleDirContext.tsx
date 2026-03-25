import * as React from 'react';

import type { LocaleDirection } from './types';

export const LocaleDirContext = React.createContext<LocaleDirection>('ltr');

LocaleDirContext.displayName = 'LocaleDirContext';
