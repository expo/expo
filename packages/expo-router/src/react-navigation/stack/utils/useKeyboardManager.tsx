import * as React from 'react';
import { type HostInstance, Keyboard, TextInput } from 'react-native';

export function useKeyboardManager({ enabled, focused }: { enabled: boolean; focused: boolean }) {
  // Numeric id of the previously focused text input
  // When a gesture didn't change the tab, we can restore the focused input with this
  const previouslyFocusedTextInputRef = React.useRef<HostInstance>(undefined);
  const startTimestampRef = React.useRef<number>(0);
  const keyboardTimeoutRef = React.useRef<NodeJS.Timeout>(undefined);
  const enabledRef = React.useRef(enabled);

  const clearKeyboardTimeout = React.useCallback(() => {
    if (keyboardTimeoutRef.current !== undefined) {
      clearTimeout(keyboardTimeoutRef.current);
      keyboardTimeoutRef.current = undefined;
    }
  }, []);

  const onPageChangeStart = React.useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    clearKeyboardTimeout();

    const input = TextInput.State.currentlyFocusedInput();

    // When a page change begins, blur the currently focused input
    input?.blur();

    // Store the id of this input so we can refocus it if change was cancelled
    previouslyFocusedTextInputRef.current = input;

    // Store timestamp for touch start
    startTimestampRef.current = Date.now();
  }, [clearKeyboardTimeout]);

  const onPageChangeCancel = React.useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    clearKeyboardTimeout();

    // The page didn't change, we should restore the focus of text input
    const input = previouslyFocusedTextInputRef.current;

    if (input) {
      // If the interaction was super short we should make sure keyboard won't hide again.

      // Too fast input refocus will result only in keyboard flashing on screen and hiding right away.
      // During first ~100ms keyboard will be dismissed no matter what,
      // so we have to make sure it won't interrupt input refocus logic.
      // That's why when the interaction is shorter than 100ms we add delay so it won't hide once again.
      // Subtracting timestamps makes us sure the delay is executed only when needed.
      if (Date.now() - startTimestampRef.current < 100) {
        keyboardTimeoutRef.current = setTimeout(() => {
          input?.focus();
          previouslyFocusedTextInputRef.current = undefined;
        }, 100);
      } else {
        input?.focus();
        previouslyFocusedTextInputRef.current = undefined;
      }
    }
  }, [clearKeyboardTimeout]);

  const onPageChangeConfirm = React.useCallback(
    ({ gesture, active, closing }: { gesture: boolean; active: boolean; closing: boolean }) => {
      if (!enabledRef.current) {
        return;
      }

      if (!closing) {
        onPageChangeCancel();
        return;
      }

      clearKeyboardTimeout();

      if (!gesture) {
        // Always dismiss input, even if we don't have a ref to it
        // We might not have the ref if onPageChangeStart was never called
        // This can happen if page change was not from a gesture
        Keyboard.dismiss();
      } else if (active) {
        const input = previouslyFocusedTextInputRef.current;

        // Dismiss the keyboard only if an input was a focused before
        // This makes sure we don't dismiss input on going back and focusing an input
        input?.blur();
      }

      // Cleanup the ID on successful page change
      previouslyFocusedTextInputRef.current = undefined;
    },
    [clearKeyboardTimeout, onPageChangeCancel]
  );

  // Dismiss keyboard when screen loses focus (e.g. when pushing a new screen).
  // This handles the "navigate forward" case so we don't dismiss the new screen's
  // auto-focused input from handleTransition.
  React.useLayoutEffect(() => {
    if (enabledRef.current && !focused) {
      Keyboard.dismiss();
    }
  }, [focused]);

  React.useLayoutEffect(() => {
    enabledRef.current = enabled;
  });

  React.useEffect(() => {
    return () => clearKeyboardTimeout();
  }, [clearKeyboardTimeout]);

  return {
    onPageChangeStart,
    onPageChangeConfirm,
    onPageChangeCancel,
  };
}
