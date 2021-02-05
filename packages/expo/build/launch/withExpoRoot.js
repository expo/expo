import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import Notifications from '../Notifications/Notifications';
export default function withExpoRoot(AppRootComponent) {
    return function ExpoRoot(props) {
        const didInitialize = React.useRef(false);
        if (!didInitialize.current) {
            if (props.exp?.notification) {
                Notifications._setInitialNotification(props.exp.notification);
            }
            didInitialize.current = true;
        }
        const combinedProps = {
            ...props,
            exp: { ...(props.exp || {}), errorRecovery: ErrorRecovery.recoveredProps },
        };
        return React.createElement(AppRootComponent, Object.assign({}, combinedProps));
    };
}
//# sourceMappingURL=withExpoRoot.js.map