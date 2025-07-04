import React from 'react';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare const ModalStackRouteDrawer: React.MemoExoticComponent<({ routeKey, options, renderScreen, onDismiss, themeColors, }: {
    routeKey: string;
    options: ExtendedStackNavigationOptions;
    renderScreen: () => React.ReactNode;
    onDismiss: () => void;
    themeColors: {
        card: string;
        background: string;
    };
}) => React.JSX.Element>;
export { ModalStackRouteDrawer };
/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
export declare function useIsDesktop(breakpoint?: number): boolean;
//# sourceMappingURL=ModalStackRouteDrawer.web.d.ts.map