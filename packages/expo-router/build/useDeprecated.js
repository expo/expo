import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';
// Node environment may render in multiple processes causing the warning to log mutiple times
// Hence we skip the warning in these environments.
const canWarn = Platform.select({
    native: process.env.NODE_ENV !== 'production',
    default: process.env.NODE_ENV !== 'production' && typeof window !== 'undefined',
});
const warned = new Set();
export function useWarnOnce(message, guard = true, key = message) {
    // useLayoutEffect typically doesn't run in node environments.
    // Combined with skipWarn, this should prevent unwanted warnings
    useLayoutEffect(() => {
        if (guard && canWarn && !warned.has(key)) {
            warned.add(key);
            console.warn(message);
        }
    }, [guard]);
}
export function useDeprecated(message, guard = true, key = message) {
    return useWarnOnce(key, guard, `Expo Router: ${message}`);
}
//# sourceMappingURL=useDeprecated.js.map