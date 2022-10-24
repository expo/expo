import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as React from 'react';
import { Platform } from 'react-native';
import DevLoadingView from '../environment/DevLoadingView';
/**
 * Append the Expo Fast Refresh view and optionally
 * keep the screen awake if `expo-keep-awake` is installed.
 */
export function withDevTools(AppRootComponent) {
    // This hook can be optionally imported because __DEV__ never changes during runtime.
    // Using __DEV__ like this enables tree shaking to remove the hook in production.
    const useOptionalKeepAwake = (() => {
        if (Platform.OS !== 'web') {
            try {
                // Optionally import expo-keep-awake
                const { useKeepAwake, ExpoKeepAwakeTag } = require('expo-keep-awake');
                return () => useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true });
            }
            catch { }
        }
        return () => { };
    })();
    const shouldUseExpoFastRefreshView = Platform.select({
        web: true,
        ios: Constants.executionEnvironment !== ExecutionEnvironment.Bare,
        default: false,
    });
    function WithDevTools(props) {
        useOptionalKeepAwake();
        if (shouldUseExpoFastRefreshView) {
            return (React.createElement(React.Fragment, null,
                React.createElement(AppRootComponent, { ...props }),
                React.createElement(DevLoadingView, null)));
        }
        return React.createElement(AppRootComponent, { ...props });
    }
    const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
    WithDevTools.displayName = `withDevTools(${name})`;
    return WithDevTools;
}
//# sourceMappingURL=withDevTools.js.map