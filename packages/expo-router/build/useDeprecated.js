"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeprecated = exports.useWarnOnce = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
// Node environment may render in multiple processes causing the warning to log mutiple times
// Hence we skip the warning in these environments.
const canWarn = react_native_1.Platform.select({
    native: process.env.NODE_ENV !== 'production',
    default: process.env.NODE_ENV !== 'production' && typeof window !== 'undefined',
});
const warned = new Set();
function useWarnOnce(message, guard = true, key = message) {
    // useLayoutEffect typically doesn't run in node environments.
    // Combined with skipWarn, this should prevent unwanted warnings
    (0, react_1.useLayoutEffect)(() => {
        if (guard && canWarn && !warned.has(key)) {
            warned.add(key);
            console.warn(message);
        }
    }, [guard]);
}
exports.useWarnOnce = useWarnOnce;
function useDeprecated(message, guard = true, key = message) {
    return useWarnOnce(key, guard, `Expo Router: ${message}`);
}
exports.useDeprecated = useDeprecated;
//# sourceMappingURL=useDeprecated.js.map