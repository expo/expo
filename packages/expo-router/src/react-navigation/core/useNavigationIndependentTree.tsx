'use client';
import { use } from 'react';

import { NavigationIndependentTreeContext } from './NavigationIndependentTreeContext';

export function useNavigationIndependentTree() {
  return use(NavigationIndependentTreeContext);
}
