import React from 'react';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare function TransparentModalStackRouteDrawer({ routeKey, options, dismissible, renderScreen, onDismiss, }: {
    routeKey: string;
    options: ExtendedStackNavigationOptions;
    renderScreen: () => React.ReactNode;
    onDismiss: () => void;
    dismissible?: boolean;
}): React.JSX.Element;
export { TransparentModalStackRouteDrawer };
//# sourceMappingURL=TransparentModalStackRouteDrawer.d.ts.map