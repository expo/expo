import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
// This hook can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let useDevKeepAwake = () => { };
if (__DEV__) {
    try {
        // Optionally import expo-keep-awake
        const { useKeepAwake } = require('expo-keep-awake');
        useDevKeepAwake = useKeepAwake;
    }
    catch { }
}
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        useDevKeepAwake();
        const combinedProps = {
            ...props,
            exp: { ...props.exp, errorRecovery: ErrorRecovery.recoveredProps },
        };
        return React.createElement(AppRootComponent, Object.assign({}, combinedProps));
    };
}
//# sourceMappingURL=withExpoRoot.js.map