'use client';
import * as React from 'react';

import type { NativeStackNavigationOptions } from '../types';

// Effective `presentation` of the screen hosting the current subtree, so nested
// navigators can skip opaque defaults inside transparent presentations.
export const ScreenPresentationContext = React.createContext<
  NativeStackNavigationOptions['presentation'] | undefined
>(undefined);
