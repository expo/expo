import { DocumentTitleOptions, LinkingOptions, LocaleDirection, NavigationContainerProps, NavigationContainerRef } from '@react-navigation/native';
import React from 'react';
declare global {
    var REACT_NAVIGATION_DEVTOOLS: WeakMap<NavigationContainerRef<any>, {
        readonly linking: LinkingOptions<any>;
    }>;
}
type Props<ParamList extends object> = NavigationContainerProps & {
    direction?: LocaleDirection;
    linking?: LinkingOptions<ParamList>;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions;
};
export declare const NavigationContainer: <RootParamList extends object = ReactNavigation.RootParamList>(props: NavigationContainerProps & {
    direction?: LocaleDirection | undefined;
    linking?: LinkingOptions<RootParamList> | undefined;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions | undefined;
} & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>> | undefined;
}) => React.ReactElement;
export {};
//# sourceMappingURL=NavigationContainer.d.ts.map