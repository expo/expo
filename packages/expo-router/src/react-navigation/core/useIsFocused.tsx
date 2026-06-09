'use client';
import * as React from 'react';
import { use } from 'react';

import { useNavigation } from './useNavigation';

export const FocusedRouteKeyContext = React.createContext<string | undefined>(undefined);

export const IsFocusedContext = React.createContext<boolean | undefined>(undefined);

/**
 * Hook to get the current focus state of the screen. Returns a `true` if screen is focused, otherwise `false`.
 * This can be used if a component needs to render something based on the focus state.
 */
export function useIsFocused(): boolean {
  const isFocused = use(IsFocusedContext);
  const navigation = useNavigation();

  const isFocusedAvailable = isFocused !== undefined;

  // Backward-compatible path (no IsFocusedContext, i.e. outside NavigationProvider): derive focus
  // from navigation focus/blur events. Read the current value during render and force a re-render
  // only when it actually changed — the off-`useSyncExternalStore` convention used across this
  // package (see global-state/useRouteInfo). Hooks run unconditionally (React Compiler friendly);
  // only the effect body is gated on whether we need the event subscription.
  const value = navigation.isFocused();
  const lastValueRef = React.useRef(value);
  lastValueRef.current = value;

  const [, forceUpdate] = React.useReducer((count: number) => count + 1, 0);
  React.useEffect(() => {
    if (isFocusedAvailable) {
      // Focus comes from context; no event subscription needed.
      return;
    }

    const checkForChange = () => {
      if (navigation.isFocused() !== lastValueRef.current) {
        forceUpdate();
      }
    };
    const unsubscribeFocus = navigation.addListener('focus', checkForChange);
    const unsubscribeBlur = navigation.addListener('blur', checkForChange);
    // Safety net: focus may have changed between the render-phase read and this subscribe.
    checkForChange();

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [isFocusedAvailable, navigation]);

  // `isFocused` from context only works with NavigationProvider; the event-derived `value` is the
  // backward-compatible fallback.
  return isFocused ?? value;
}
