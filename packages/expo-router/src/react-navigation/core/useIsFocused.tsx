'use client';
import * as React from 'react';
import { use } from 'react';

export const FocusedRouteKeyContext = React.createContext<string | undefined>(undefined);

export const IsFocusedContext = React.createContext<boolean | undefined>(undefined);

/**
 * Hook to get the current focus state of the screen. Returns a `true` if screen is focused, otherwise `false`.
 * This can be used if a component needs to render something based on the focus state.
 */
export function useIsFocused(): boolean {
  const isFocused = use(IsFocusedContext);

  if (isFocused === undefined) {
    throw new Error(
      "Couldn't find a navigation object. Make sure the component is rendered inside your app's route tree. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues."
    );
  }

  return isFocused;
}
