import { useCallback, useEffect, useRef, useState } from 'react';

import { wasLastInputKeyboard } from './keyboardEvent.fx';

/**
 * Shared hook for onAppear/onDisappear lifecycle callbacks.
 * Uses refs so the latest callback is always invoked, even if the parent
 * re-renders with a new function reference.
 */
export function useUniversalLifecycle(onAppear?: () => void, onDisappear?: () => void) {
  const onAppearRef = useRef(onAppear);
  const onDisappearRef = useRef(onDisappear);
  onAppearRef.current = onAppear;
  onDisappearRef.current = onDisappear;

  useEffect(() => {
    onAppearRef.current?.();
    return () => {
      onDisappearRef.current?.();
    };
  }, []);
}

/**
 * Tracks whether the element should display a keyboard focus indicator,
 * mirroring the browser's `:focus-visible` heuristic. Spread the returned
 * `onFocus`/`onBlur` onto a focusable element (e.g. `Pressable`) and read
 * `focusVisible` to conditionally apply focus styles.
 */
export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = useState(false);

  const onFocus = useCallback(() => {
    if (wasLastInputKeyboard()) {
      setFocusVisible(true);
    }
  }, []);

  const onBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  return { focusVisible, onFocus, onBlur };
}
