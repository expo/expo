'use client';
import * as React from 'react';
import { Platform } from 'react-native';

import { ScreenRemovalPreventionSetterContext } from '../../global-state/removalPrevention';
import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationAction } from '../routers';
import { IsPreloadedContext } from './IsPreloadedContext';
import type { EventListenerCallback, EventMapCore } from './types';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useNavigation } from './useNavigation';

const NOOP = () => {};

export type PreventRemoveOptions = {
  /**
   * Whether removal prevention remains active while the screen is preloaded.
   * @default false
   */
  preventInPreloadedRoutes?: boolean;
};

function useWarnOnStalePreventRemoveDev(preventRemove: boolean) {
  const [shouldCheck, setShouldCheck] = React.useState(false);

  React.useEffect(() => {
    if (!shouldCheck) {
      return;
    }

    setShouldCheck(false);
    if (preventRemove) {
      console.warn(
        '`repeat` or `disablePrevention` from `usePreventRemove` was called, but `preventRemove` is ' +
          'still `true`. The screen is no longer protected, but the hook will not re-enable ' +
          'prevention until `preventRemove` changes. Set `preventRemove` to `false` in the same ' +
          'handler to keep the prop and the prevention state in sync.'
      );
    }
  }, [shouldCheck, preventRemove]);

  return React.useCallback(() => setShouldCheck(true), []);
}

// Dev-only: warns when `disablePrevention` was called but `preventRemove` is still `true`.
const useWarnOnStalePreventRemove: (preventRemove: boolean) => () => void =
  process.env.NODE_ENV === 'production' ? () => NOOP : useWarnOnStalePreventRemoveDev;

/**
 * Prevents the screen from being removed while `preventRemove` is `true` and calls `callback`
 * with the blocked navigation action.
 *
 * To continue the blocked navigation action, set `preventRemove` to `false` and call the
 * callback's `repeat` function. To navigate somewhere else, set `preventRemove` to `false`, call
 * the returned `disablePrevention` function, and then navigate.
 *
 * On web, this hook also prevents the browser from unloading the page while `preventRemove` is
 * `true`.
 *
 * @example
 * ```tsx
 * const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
 * usePreventRemove(hasUnsavedChanges, ({ repeat }) => {
 *   Alert.alert('Discard changes?', undefined, [
 *     { text: 'Cancel', style: 'cancel' },
 *     {
 *       text: 'Discard',
 *       style: 'destructive',
 *       onPress: () => {
 *         setHasUnsavedChanges(false);
 *         repeat();
 *       },
 *     },
 *   ]);
 * });
 * ```
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Optional function called when the screen was prevented from being removed.
 * @param options Options that configure removal prevention.
 */
export function usePreventRemove(
  preventRemove: boolean,
  callback?: (options: { data: { action: NavigationAction }; repeat: () => void }) => void,
  options?: PreventRemoveOptions
) {
  const id = React.useId();
  const navigation = useNavigation();
  const setPreventRemove = React.use(ScreenRemovalPreventionSetterContext);
  const isPreloaded = React.use(IsPreloadedContext);
  const markDisabled = useWarnOnStalePreventRemove(preventRemove);
  const preventBeforeUnloadRef = React.useRef(preventRemove);
  const preventInPreloadedRoutes = options?.preventInPreloadedRoutes ?? false;
  const shouldPreventBeforeUnload = preventRemove && (!isPreloaded || preventInPreloadedRoutes);

  if (setPreventRemove === undefined) {
    throw new Error(
      "Couldn't find the prevent remove context. Is your component inside Screen or Layout?"
    );
  }

  useClientLayoutEffect(() => {
    preventBeforeUnloadRef.current = shouldPreventBeforeUnload;
    setPreventRemove(id, preventRemove, preventInPreloadedRoutes);
    return () => {
      preventBeforeUnloadRef.current = false;
      setPreventRemove(id, false, preventInPreloadedRoutes);
    };
  }, [id, preventInPreloadedRoutes, preventRemove, setPreventRemove, shouldPreventBeforeUnload]);

  // TODO(@ubax): use standard useCallback if possible
  const disablePrevention = useLatestCallback(() => {
    preventBeforeUnloadRef.current = false;
    setPreventRemove(id, false, preventInPreloadedRoutes);
    markDisabled();
  });

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !shouldPreventBeforeUnload) {
      return;
    }

    const preventBeforeUnload = (event: BeforeUnloadEvent) => {
      if (preventBeforeUnloadRef.current) {
        event.preventDefault();
        event.returnValue = true;
      }
    };

    window.addEventListener('beforeunload', preventBeforeUnload);
    return () => window.removeEventListener('beforeunload', preventBeforeUnload);
  }, [shouldPreventBeforeUnload]);

  const removePreventedListener = useLatestCallback<
    EventListenerCallback<EventMapCore<any>, 'removePrevented'>
  >((event) => {
    if (preventRemove && callback) {
      callback({
        data: event.data,
        repeat: () => {
          disablePrevention();
          navigation.dispatch(event.data.action);
        },
      });
    }
  });

  React.useEffect(
    () => navigation.addListener('removePrevented', removePreventedListener),
    [navigation, removePreventedListener]
  );
  return disablePrevention;
}
