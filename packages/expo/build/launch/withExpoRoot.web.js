import * as React from 'react';
import { attachRecoveredProps } from './RecoveryProps';
export default function withExpoRoot(AppRootComponent) {
    return class ExpoRootComponent extends React.Component {
        render() {
            const combinedProps = attachRecoveredProps(this.props);
            return React.createElement(AppRootComponent, { ...combinedProps });
        }
    };
}
//# sourceMappingURL=withExpoRoot.web.js.map