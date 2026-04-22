import * as React from 'react';
/**
 * Use `useEffect` during SSR and `useInsertionEffect` in the Browser & React Native to avoid warnings.
 */
const useClientInsertionEffect = typeof document !== 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? React.useInsertionEffect
    : React.useEffect;
/**
 * React hook which returns the latest callback without changing the reference.
 */
// TODO(@ubax): RN Migration - Consider replacing with useEffectEvent when it becomes stable
export default function useLatestCallback(callback) {
    const ref = React.useRef(callback);
    const latestCallback = React.useRef(function latestCallback(...args) {
        return ref.current.apply(this, args);
    }).current;
    useClientInsertionEffect(() => {
        ref.current = callback;
    }, [callback]);
    return latestCallback;
}
//# sourceMappingURL=useLatestCallback.js.map