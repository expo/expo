import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
// This method can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let activateDevKeepAwake;
if (__DEV__) {
    try {
        // Optionally import expo-keep-awake
        const { activateKeepAwake } = require('expo-keep-awake');
        activateDevKeepAwake = activateKeepAwake;
    }
    catch { }
}
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        // Using `useKeepAwake` throws an exception when the app is closed on Android.
        // On app close, the `currentActivity` is null and deactivating will always throw.
        React.useEffect(() => activateDevKeepAwake(), []);
        const combinedProps = {
            ...props,
            exp: { ...props.exp, errorRecovery: ErrorRecovery.recoveredProps },
        };
        return React.createElement(AppRootComponent, Object.assign({}, combinedProps));
    };
}
//# sourceMappingURL=withExpoRoot.js.map