import * as ErrorRecovery from 'expo-error-recovery';
import * as Font from 'expo-font';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import Notifications from '../Notifications/Notifications';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        const didInitialize = React.useRef(false);
        if (!didInitialize.current) {
            if (StyleSheet.setStyleAttributePreprocessor) {
                StyleSheet.setStyleAttributePreprocessor('fontFamily', Font.processFontFamily);
            }
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
        if (__DEV__) {
            return (<RootErrorBoundary>
          <AppRootComponent {...combinedProps}/>
        </RootErrorBoundary>);
        }
        else {
            return <AppRootComponent {...combinedProps}/>;
        }
    };
}
//# sourceMappingURL=withExpoRoot.js.map