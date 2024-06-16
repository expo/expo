type EffectCallback = () => undefined | void | (() => void);
/**
 * Hook to run an effect in a focused screen, similar to `React.useEffect`.
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *
 * @param callback Memoized callback containing the effect, should optionally return a cleanup function.
 */
export declare function useFocusEffect(effect: EffectCallback, do_not_pass_a_second_prop?: never): void;
export {};
//# sourceMappingURL=useFocusEffect.d.ts.map