import * as React from 'react';
// This hook can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let useDevKeepAwake = () => { };
if (__DEV__) {
    try {
        // Optionally import expo-keep-awake
        const { useKeepAwake, ExpoKeepAwakeTag } = require('expo-keep-awake');
        useDevKeepAwake = () => useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true });
    }
    catch { }
}
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        useDevKeepAwake();
        return React.createElement(AppRootComponent, { ...props });
    };
}
//# sourceMappingURL=withExpoRoot.js.map