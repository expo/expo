import * as React from 'react';
import { type NavigationContainerProps, type NavigationContainerRef, type ParamListBase } from '../core';
import type { DocumentTitleOptions, LinkingOptions, LocaleDirection } from './types';
declare global {
    var REACT_NAVIGATION_DEVTOOLS: WeakMap<NavigationContainerRef<any>, {
        readonly linking: LinkingOptions<any>;
    }>;
}
type Props<ParamList extends ParamListBase> = NavigationContainerProps & {
    /**
     * Initial state object for the navigation tree.
     *
     * If this is provided, deep link or URLs won't be handled on the initial render.
     */
    initialState?: NavigationContainerProps['initialState'];
    /**
     * Text direction of the components. Defaults to `'ltr'`.
     */
    direction?: LocaleDirection;
    /**
     * Options for deep linking.
     *
     * Deep link handling is enabled when this prop is provided,
     * unless `linking.enabled` is `false`.
     */
    linking?: LinkingOptions<ParamList>;
    /**
     * Fallback element to render until initial state is resolved from deep linking.
     *
     * Defaults to `null`.
     */
    fallback?: React.ReactNode;
    /**
     * Options to configure the document title on Web.
     *
     * Updating document title is handled by default,
     * unless `documentTitle.enabled` is `false`.
     */
    documentTitle?: DocumentTitleOptions;
};
/**
 * Container component that manages the navigation state.
 * This should be rendered at the root wrapping the whole app.
 */
export declare const NavigationContainer: <RootParamList extends ParamListBase = ReactNavigation.RootParamList>(props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
}) => React.ReactElement;
export {};
//# sourceMappingURL=NavigationContainer.d.ts.map