import React from 'react';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare function ModalStackRouteDrawer({ routeKey, options, renderScreen, onDismiss, themeColors, }: {
    routeKey: string;
    options: ExtendedStackNavigationOptions;
    renderScreen: () => React.ReactNode;
    onDismiss: () => void;
    themeColors: {
        card: string;
        background: string;
    };
}): React.JSX.Element;
export { ModalStackRouteDrawer };
//# sourceMappingURL=ModalStackRouteDrawer.d.ts.map