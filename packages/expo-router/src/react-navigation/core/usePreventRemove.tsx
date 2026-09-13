'use client';
import * as React from 'react';

import { ScreenRemovalPreventionSetterContext } from '../../global-state/removalPrevention';
import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationAction } from '../routers';
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
  const markDisabled = useWarnOnStalePreventRemove(preventRemove);
  const preventInPreloadedRoutes = options?.preventInPreloadedRoutes ?? false;

  if (setPreventRemove === undefined) {
    throw new Error(
      "Couldn't find the prevent remove context. Is your component inside Screen or Layout?"
    );
  }

  useClientLayoutEffect(() => {
    setPreventRemove(id, preventRemove, preventInPreloadedRoutes);
    return () => {
      setPreventRemove(id, false, preventInPreloadedRoutes);
    };
  }, [id, preventInPreloadedRoutes, preventRemove, setPreventRemove]);

  // TODO(@ubax): use standard useCallback if possible
  const disablePrevention = useLatestCallback(() => {
    setPreventRemove(id, false, preventInPreloadedRoutes);
    markDisabled();
  });

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
