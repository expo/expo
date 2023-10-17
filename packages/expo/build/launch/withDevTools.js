import * as React from 'react';
// Keep the screen awake on Android, we don't use the Fast Refresh overlay here.
// The default behavior here is to skip the custom Fast Refresh indicator.
export function withDevTools(AppRootComponent) {
    // This hook can be optionally imported because __DEV__ never changes during runtime.
    // Using __DEV__ like this enables tree shaking to remove the hook in production.
    const useOptionalKeepAwake = (() => {
        try {
            // Optionally import expo-keep-awake
            const { useKeepAwake, ExpoKeepAwakeTag } = require('expo-keep-awake');
            return () => useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true });
        }
        catch { }
        return () => { };
    })();
    function WithDevTools(props) {
        useOptionalKeepAwake();
        return <AppRootComponent {...props}/>;
    }
    if (process.env.NODE_ENV !== 'production') {
        const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
        WithDevTools.displayName = `withDevTools(${name})`;
    }
    return WithDevTools;
}
//# sourceMappingURL=withDevTools.js.map