'use client';
import { use } from 'react';

import type { NavigationState } from '../routers';
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
  const navigation = use(NavigationContext);

  if (navigation === undefined) {
    throw new Error(
      "Couldn't find a navigation object. This is most likely an issue in expo-router."
    );
  }

  // FIXME: Figure out a better way to do this
  return navigation as unknown as T;
}
