import { type Ref } from 'react';
/**
 * Builds a ref that forwards its value to each of the given refs, in the order
 * they are given. Handles object refs and callback refs, including a callback
 * ref that returns its own cleanup function.
 *
 * A copy of React Native's `useMergeRefs`, which lives behind a deep internal
 * import: those are deprecated, warn in development, and have no counterpart in
 * React Native for web.
 */
export declare function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]): (instance: T | null) => void;
//# sourceMappingURL=useMergeRefs.d.ts.map