import * as React from 'react';

import { NavigationIndependentTreeContext } from './NavigationIndependentTreeContext';

export function useNavigationIndependentTree() {
  return React.useContext(NavigationIndependentTreeContext);
}
