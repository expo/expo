'use client';

import { createContext } from 'react';

// An error from the root reducer. The root navigator throws it while rendering, so that the root
// layout's error boundary shows it instead of the app unmounting.
export const NavigationErrorContext = createContext<Error | undefined>(undefined);
