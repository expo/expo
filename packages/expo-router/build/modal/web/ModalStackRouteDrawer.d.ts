import React from 'react';
import type { ColorValue } from 'react-native';
import type { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare function ModalStackRouteDrawer({ routeKey, options, dismissible, renderScreen, onDismiss, themeColors, }: {
    routeKey: string;
    options: ExtendedStackNavigationOptions;
    renderScreen: () => React.ReactNode;
    onDismiss: () => void;
    themeColors: {
        card: ColorValue;
        background: ColorValue;
    };
    dismissible?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export { ModalStackRouteDrawer };
//# sourceMappingURL=ModalStackRouteDrawer.d.ts.map