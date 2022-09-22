import * as React from 'react';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            return React.createElement(AppRootComponent, { ...this.props });
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map