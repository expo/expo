import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

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

// Default to true on other platforms than web (native, SSR) so any focus
// event registers as keyboard-driven there. On web, a pointer event flips this
// to false before the focus event fires.
let hadKeyboardEvent = Platform.OS !== 'web';

if (Platform.OS === 'web') {
  window.addEventListener(
    'keydown',
    (event) => {
      if (!event.altKey && !event.ctrlKey && !event.metaKey) {
        hadKeyboardEvent = true;
      }
    },
    true
  );

  const onPointer = () => {
    hadKeyboardEvent = false;
  };

  window.addEventListener('mousedown', onPointer, true);
  window.addEventListener('pointerdown', onPointer, true);
  window.addEventListener('touchstart', onPointer, true);
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
    if (hadKeyboardEvent) {
      setFocusVisible(true);
    }
  }, []);

  const onBlur = useCallback(() => {
    setFocusVisible(false);
  }, []);

  return { focusVisible, onFocus, onBlur };
}
