import type { NavigationState } from '@react-navigation/routers';
import * as React from 'react';

import { NavigationContext } from './NavigationContext';
import type { EventMapCore } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';

type Options<State extends NavigationState> = {
  state: State;
  emitter: NavigationEventEmitter<EventMapCore<State>>;
};

/**
 * Hook to take care of emitting `focus` and `blur` events.
 */
export function useFocusEvents<State extends NavigationState>({
  state,
  emitter,
}: Options<State>) {
  const navigation = React.useContext(NavigationContext);
  const lastFocusedKeyRef = React.useRef<string | undefined>(undefined);

  const currentFocusedKey = state.routes[state.index].key;

  // When the parent screen changes its focus state, we also need to change child's focus
  // Coz the child screen can't be focused if the parent screen is out of focus
  React.useEffect(
    () =>
      navigation?.addListener('focus', () => {
        lastFocusedKeyRef.current = currentFocusedKey;
        emitter.emit({ type: 'focus', target: currentFocusedKey });
      }),
    [currentFocusedKey, emitter, navigation]
  );

  React.useEffect(
    () =>
      navigation?.addListener('blur', () => {
        lastFocusedKeyRef.current = undefined;
        emitter.emit({ type: 'blur', target: currentFocusedKey });
      }),
    [currentFocusedKey, emitter, navigation]
  );

  React.useEffect(() => {
    const lastFocusedKey = lastFocusedKeyRef.current;

    lastFocusedKeyRef.current = currentFocusedKey;

    // We wouldn't have `lastFocusedKey` on initial mount
    // Fire focus event for the current route on mount if there's no parent navigator
    if (lastFocusedKey === undefined && !navigation) {
      emitter.emit({ type: 'focus', target: currentFocusedKey });
    }

    // We should only emit events when the focused key changed and navigator is focused
    // When navigator is not focused, screens inside shouldn't receive focused status either
    if (
      lastFocusedKey === currentFocusedKey ||
      !(navigation ? navigation.isFocused() : true)
    ) {
      return;
    }

    if (lastFocusedKey === undefined) {
      // Only fire events after initial mount
      return;
    }

    emitter.emit({ type: 'blur', target: lastFocusedKey });
    emitter.emit({ type: 'focus', target: currentFocusedKey });
  }, [currentFocusedKey, emitter, navigation]);
}
