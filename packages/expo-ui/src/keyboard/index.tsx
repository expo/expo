import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { HostInstance } from 'react-native';

import TextInputState from './textInputState';

/**
 * Lets the text inputs inside a `Host` tell it when they mount and when they take focus, so the
 * host can enroll in React Native's `TextInputState` on their behalf.
 */
export type KeyboardCoordination = {
  /** Adds a field to the host. Returns the function to call when the field unmounts. */
  addField: (field: object) => () => void;
  /** Reports whether a field currently holds focus. */
  setFieldFocused: (field: object, focused: boolean) => void;
};

export const KeyboardCoordinationContext = createContext<KeyboardCoordination | null>(null);

/**
 * What a ref on a view from `requireNativeView` resolves to. It is a wrapper carrying the view's
 * async functions, not the host component React Native hit-tests, so the host component has to be
 * read off it. `getNativeRef` is absent on web, where there is nothing to coordinate.
 */
export type NativeViewRef = { getNativeRef?: () => HostInstance | null };

/**
 * Enrolls a `Host` in React Native's `TextInputState` while it contains at least one focusable
 * text input.
 *
 * React Native decides whether a touch dismisses the keyboard entirely in JavaScript: `ScrollView`
 * asks `TextInputState` which input is focused, whether the touch landed on it, and blurs it
 * otherwise. Native fields hosted here are SwiftUI or Compose views with no React Native view of
 * their own, so the host — the view React Native hit-tests — is what has to be registered.
 *
 * Hosts without a text input stay out of the registry. Registering them would make React Native
 * treat a touch on any hosted content as a touch on a text input, and keep the keyboard open.
 */
export function useHostKeyboardCoordination() {
  const hostRef = useRef<NativeViewRef | null>(null);
  const state = useRef({
    fields: new Set<object>(),
    focusedFields: new Set<object>(),
    // The instance passed to `registerInput`, kept so the matching `unregisterInput` uses the same
    // one even after React has detached the ref.
    registered: null as HostInstance | null,
  }).current;

  const coordination = useMemo<KeyboardCoordination>(() => {
    const syncRegistration = () => {
      const host = hostRef.current?.getNativeRef?.();
      if (state.fields.size > 0 && !state.registered && host) {
        state.registered = host;
        TextInputState.registerInput(state.registered);
      } else if (state.fields.size === 0 && state.registered) {
        TextInputState.unregisterInput(state.registered);
        state.registered = null;
      }
    };

    const syncFocus = () => {
      if (!state.registered) {
        return;
      }
      if (state.focusedFields.size > 0) {
        TextInputState.focusInput(state.registered);
      } else {
        TextInputState.blurInput(state.registered);
      }
    };

    return {
      addField: (field) => {
        state.fields.add(field);
        syncRegistration();
        return () => {
          state.fields.delete(field);
          state.focusedFields.delete(field);
          syncFocus();
          syncRegistration();
        };
      },
      setFieldFocused: (field, focused) => {
        if (focused) {
          state.focusedFields.add(field);
        } else {
          state.focusedFields.delete(field);
        }
        syncFocus();
      },
    };
  }, [state]);

  return { hostRef, coordination };
}

/**
 * Reports a hosted text input's focus to its `Host`. Returns the callback to call whenever the
 * field gains or loses focus. Does nothing outside a `Host`, or on web.
 */
export function useTextInputKeyboardCoordination() {
  const coordination = useContext(KeyboardCoordinationContext);
  const field = useRef({}).current;

  useEffect(() => coordination?.addField(field), [coordination, field]);

  return useCallback(
    (focused: boolean) => coordination?.setFieldFocused(field, focused),
    [coordination, field]
  );
}
