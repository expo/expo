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
      "Couldn't find a navigation object. Make sure the component is rendered inside your app's route tree. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues."
    );
  }

  return navigation as T;
}
