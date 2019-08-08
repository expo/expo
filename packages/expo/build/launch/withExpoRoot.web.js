import * as React from 'react';
import RootErrorBoundary from './RootErrorBoundary';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            if (__DEV__) {
                return (<RootErrorBoundary>
            <AppRootComponent {...this.props}/>
          </RootErrorBoundary>);
            }
            else {
                return <AppRootComponent {...this.props}/>;
            }
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map