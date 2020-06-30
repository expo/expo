import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import { Platform } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import Notifications from '../Notifications/Notifications';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        const didInitialize = React.useRef(false);
        if (!didInitialize.current) {
            const { exp } = props;
            if (exp.notification) {
                Notifications._setInitialNotification(exp.notification);
            }
            didInitialize.current = true;
        }
        const combinedProps = {
            ...props,
            exp: { ...props.exp, errorRecovery: ErrorRecovery.recoveredProps },
        };
        // NOTE(brentvatne): we use AppearanceProvider because useColorScheme does
        // not work correctly on iOS without. we include it on all platforms
        // for consistency - also see withExpoRoot.web.tsx
        const AppWithProviders = (React.createElement(AppearanceProvider, null,
            React.createElement(AppRootComponent, Object.assign({}, combinedProps))));
        if (__DEV__ && Platform.OS === 'android') {
            return React.createElement(RootErrorBoundary, null, AppWithProviders);
        }
        else {
            return AppWithProviders;
        }
    };
}
//# sourceMappingURL=withExpoRoot.js.map