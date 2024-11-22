/**
 * Memoized callback containing the effect, should optionally return a cleanup function.
 */
export type EffectCallback = () => undefined | void | (() => void);
/**
 * Hook to run an effect whenever a route is **focused**. Similar to
 * [`React.useEffect`](https://react.dev/reference/react/useEffect).
 *
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in [`React.useCallback`](https://react.dev/reference/react/useCallback)
 * to avoid running the effect too often.
 *
 * @example
 * ```tsx
 * import { useFocusEffect } from 'expo-router';
 * import { useCallback } from 'react';
 *
 * export default function Route() {
 *   useFocusEffect(
 *     // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *     useCallback(() => {
 *       // Invoked whenever the route is focused.
 *       console.log('Hello, I'm focused!');
 *
 *       // Return function is invoked whenever the route gets out of focus.
 *       return () => {
 *         console.log('This route is now unfocused.');
 *       };
 *     }, []);
 *    );
 *
 *  return </>;
 * }
 *```
 *
 * @param effect Memoized callback containing the effect, should optionally return a cleanup function.
 * @param do_not_pass_a_second_prop
 */
export declare function useFocusEffect(effect: EffectCallback, do_not_pass_a_second_prop?: never): void;
//# sourceMappingURL=useFocusEffect.d.ts.map