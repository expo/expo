import * as React from 'react';
import * as ErrorRecovery from 'expo-error-recovery';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            const props = {
                ...this.props,
                exp: { ...this.props.exp, errorRecovery: ErrorRecovery.recoveredProps },
            };
            if (__DEV__) {
                return (<RootErrorBoundary>
            <AppRootComponent {...props}/>
          </RootErrorBoundary>);
            }
            else {
                return <AppRootComponent {...props}/>;
            }
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map