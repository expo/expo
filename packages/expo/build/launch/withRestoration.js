import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as React from 'react';
import { Platform } from 'react-native';
import DevLoadingView from '../environment/DevLoadingView';
const isDevLoadingDisabled = !__DEV__ ||
    Platform.OS === 'android' ||
    (Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.Bare);
// This hook can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let useDevKeepAwake = () => { };
if (__DEV__ && Platform.OS !== 'web') {
    try {
        // Optionally import expo-keep-awake
        const { useKeepAwake, ExpoKeepAwakeTag } = require('expo-keep-awake');
        useDevKeepAwake = () => useKeepAwake(ExpoKeepAwakeTag, { suppressDeactivateWarnings: true });
    }
    catch { }
}
const attachRecoveredProps = (props) => {
    try {
        // Optionally import expo-error-recovery
        const { recoveredProps } = require('expo-error-recovery');
        return {
            ...props,
            exp: { ...props.exp, errorRecovery: recoveredProps },
        };
    }
    catch { }
    return props;
};
export default function withRestoration(AppRootComponent) {
    function WithRestoration(props) {
        useDevKeepAwake();
        const combinedProps = attachRecoveredProps(props);
        if (!isDevLoadingDisabled) {
            return React.createElement(AppRootComponent, { ...combinedProps });
        }
        // dev-mode only for managed iOS and web.
        return (React.createElement(React.Fragment, null,
            React.createElement(AppRootComponent, { ...combinedProps }),
            React.createElement(DevLoadingView, null)));
    }
    if (__DEV__) {
        const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
        WithRestoration.displayName = `withRestoration(${name})`;
    }
    return WithRestoration;
}
//# sourceMappingURL=withRestoration.js.map