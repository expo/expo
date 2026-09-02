import { useRef } from 'react';

/**
 * Throws `error` if `value` ever differs from its initial render value.
 * Equality is checked with `!==` (reference equality), so a freshly built
 * object with the same shape as the previous one will trigger a throw.
 */
export function useAssertValueDoesNotChange<T>(value: T, error: string) {
  const initialValue = useRef(value);
  if (initialValue.current !== value) {
    throw new Error(error);
  }
}
