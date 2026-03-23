import { type NavigationState } from '@react-navigation/routers';
import * as React from 'react';

import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationContext } from './NavigationContext';
import type { NavigationProp } from './types';

/**
 * Hook to access the navigation prop of the parent screen anywhere.
 *
 * @returns Navigation prop of the parent screen.
 */
export function useNavigation<
  T = Omit<NavigationProp<ReactNavigation.RootParamList>, 'getState'> & {
    getState(): NavigationState | undefined;
  },
>(): T {
  const root = React.useContext(NavigationContainerRefContext);
  const navigation = React.useContext(NavigationContext);

  if (navigation === undefined && root === undefined) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }

  // FIXME: Figure out a better way to do this
  return (navigation ?? root) as unknown as T;
}
