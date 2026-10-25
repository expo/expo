'use client';
import * as React from 'react';
import { use } from 'react';

import type { NavigationState } from '../routers';
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
export function useFocusEvents<State extends NavigationState>({ state, emitter }: Options<State>) {
  const navigation = use(NavigationContext);
  const lastFocusedKeyRef = React.useRef<string | undefined>(undefined);
  // TODO(@ubax): investigate if we can remove this ref, by for example moving this to global scope
  // Or reacting to state changes
  const isFocusedRef = React.useRef(false);

  const currentFocusedKey = state.routes[state.index]?.key;

  // When the parent screen changes its focus state, we also need to change child's focus
  // Coz the child screen can't be focused if the parent screen is out of focus
  React.useEffect(() => {
    if (currentFocusedKey === undefined) {
      return;
    }

    return navigation?.addListener('focus', () => {
      if (isFocusedRef.current && lastFocusedKeyRef.current === currentFocusedKey) {
        return;
      }
      lastFocusedKeyRef.current = currentFocusedKey;
      isFocusedRef.current = true;
      emitter.emit({ type: 'focus', target: currentFocusedKey });
    });
  }, [currentFocusedKey, emitter, navigation]);

  React.useEffect(() => {
    if (currentFocusedKey === undefined) {
      return;
    }

    return navigation?.addListener('blur', () => {
      lastFocusedKeyRef.current = undefined;
      isFocusedRef.current = false;
      emitter.emit({ type: 'blur', target: currentFocusedKey });
    });
  }, [currentFocusedKey, emitter, navigation]);

  React.useEffect(() => {
    const lastFocusedKey = lastFocusedKeyRef.current;

    if (currentFocusedKey === undefined) {
      return;
    }

    lastFocusedKeyRef.current = currentFocusedKey;

    // A nested navigator can mount while its parent is already focused, such as after HMR.
    // Screen effects run first and ignore this event if they already observed focus.
    if (lastFocusedKey === undefined && (!navigation || navigation.isFocused())) {
      isFocusedRef.current = true;
      emitter.emit({ type: 'focus', target: currentFocusedKey });
    }

    // We should only emit events when the focused key changed and navigator is focused
    // When navigator is not focused, screens inside shouldn't receive focused status either
    if (lastFocusedKey === currentFocusedKey || !(navigation ? navigation.isFocused() : true)) {
      return;
    }

    if (lastFocusedKey === undefined) {
      // Only fire events after initial mount
      return;
    }

    emitter.emit({ type: 'blur', target: lastFocusedKey });
    isFocusedRef.current = true;
    emitter.emit({ type: 'focus', target: currentFocusedKey });
  }, [currentFocusedKey, emitter, navigation]);
}
