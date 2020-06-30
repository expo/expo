import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import { AppearanceProvider } from 'react-native-appearance';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            const props = {
                ...this.props,
                exp: { ...this.props.exp, errorRecovery: ErrorRecovery.recoveredProps },
            };
            return (React.createElement(AppearanceProvider, null,
                React.createElement(AppRootComponent, Object.assign({}, props))));
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map