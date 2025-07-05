import React from 'react';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';
declare function TransparentModalStackRouteDrawer({ routeKey, options, renderScreen, onDismiss, }: {
    routeKey: string;
    options: ExtendedStackNavigationOptions;
    renderScreen: () => React.ReactNode;
    onDismiss: () => void;
}): React.JSX.Element;
export { TransparentModalStackRouteDrawer };
/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
export declare function useIsDesktop(breakpoint?: number): boolean;
//# sourceMappingURL=TransparentModalStackRouteDrawer.web.d.ts.map