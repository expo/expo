'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';

import useLatestCallback from '../../utils/useLatestCallback';
import type { NavigationAction } from '../routers';
import type { EventListenerCallback, EventMapCore } from './types';
import { useNavigation } from './useNavigation';
import { usePreventRemoveContext } from './usePreventRemoveContext';
import { useRoute } from './useRoute';

/**
 * Prevents the screen from being removed while `preventRemove` is `true` and calls `callback`
 * with the blocked navigation action.
 *
 * To continue, first set `preventRemove` to `false`, then call `router.back()` from the same
 * press handler. To retry the blocked action, store it in the callback and dispatch it from an
 * effect after `preventRemove` becomes `false`. Dispatching synchronously inside the callback
 * re-triggers prevention.
 *
 * @example
 * ```tsx
 * const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * usePreventRemove(hasUnsavedChanges, () => setShowConfirm(true));
 *
 * {showConfirm && (
 *   <Button
 *     title="Discard changes"
 *     onPress={() => {
 *       setHasUnsavedChanges(false);
 *       router.back();
 *     }}
 *   />
 * )}
 * ```
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Function which is executed when screen was prevented from being removed.
 */
export function usePreventRemove(
  preventRemove: boolean,
  callback: (options: { data: { action: NavigationAction } }) => void
) {
  const [id] = React.useState(() => nanoid());
  const navigation = useNavigation();
  const { key: routeKey } = useRoute();
  const { setPreventRemove } = usePreventRemoveContext();

  React.useEffect(() => {
    setPreventRemove(id, routeKey, preventRemove);
    return () => {
      setPreventRemove(id, routeKey, false);
    };
  }, [id, preventRemove, routeKey, setPreventRemove]);

  const removePreventedListener = useLatestCallback<
    EventListenerCallback<EventMapCore<any>, 'removePrevented'>
  >((event) => {
    if (preventRemove) {
      callback({ data: event.data });
    }
  });

  React.useEffect(
    () => navigation.addListener('removePrevented', removePreventedListener),
    [navigation, removePreventedListener]
  );
}
