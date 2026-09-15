import { useCallback, useRef, type Ref } from 'react';

/**
 * Builds a ref that forwards its value to each of the given refs, in the order
 * they are given. Handles object refs and callback refs, including a callback
 * ref that returns its own cleanup function.
 *
 * A copy of React Native's `useMergeRefs`, which lives behind a deep internal
 * import: those are deprecated, warn in development, and have no counterpart in
 * React Native for web.
 */
export function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]): (instance: T | null) => void {
  const cleanups = useRef<(void | (() => void))[]>([]);

  return useCallback(
    (instance: T | null) => {
      for (const cleanup of cleanups.current) {
        cleanup?.();
      }
      cleanups.current = [];
      if (instance == null) {
        return;
      }
      cleanups.current = refs.map((ref) => {
        if (ref == null) {
          return undefined;
        }
        if (typeof ref === 'function') {
          const cleanup = ref(instance);
          return typeof cleanup === 'function' ? cleanup : () => ref(null);
        }
        // React's `RefObject<T>` type does not admit null, but a detached ref has
        // to be cleared, which is what React itself does here.
        const refObject = ref as { current: T | null };
        refObject.current = instance;
        return () => {
          refObject.current = null;
        };
      });
    },
    // The refs are the dependencies. Changing one has to produce a new ref so that
    // React detaches the old one and attaches the new, which is how React Native's
    // own `useMergeRefs` behaves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}
