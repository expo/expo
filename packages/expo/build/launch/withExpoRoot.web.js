import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            const props = {
                ...this.props,
                exp: { ...this.props.exp, errorRecovery: ErrorRecovery.recoveredProps },
            };
            return <AppRootComponent {...props}/>;
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map