import * as React from 'react';
import { attachRecoveredProps } from './RecoveryProps';
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
        const combinedProps = attachRecoveredProps(props);
        return React.createElement(AppRootComponent, { ...combinedProps });
    };
}
//# sourceMappingURL=withExpoRoot.js.map