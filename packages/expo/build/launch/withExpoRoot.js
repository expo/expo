import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import { Platform } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
        // NOTE(brentvatne): reasons why we use these providers below. we should aim
        // to remove them.
        // 1) AppearanceProvider: useColorScheme does not work correctly on iOS without it
        // 2) SafeAreaProvider: initial layout measurements can be incorrect on Android
        // 3) we include them on all platforms for consistency - also see withExpoRoot.web.tsx
        const AppWithProviders = (React.createElement(AppearanceProvider, null,
            React.createElement(SafeAreaProvider, null,
                React.createElement(AppRootComponent, Object.assign({}, combinedProps)))));
        if (__DEV__ && Platform.OS === 'android') {
            return React.createElement(RootErrorBoundary, null, AppWithProviders);
        }
        else {
            return AppWithProviders;
        }
    };
}
//# sourceMappingURL=withExpoRoot.js.map