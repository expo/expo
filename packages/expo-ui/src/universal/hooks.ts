import { useEffect, useRef } from 'react';

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
