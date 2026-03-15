import { DocumentTitleOptions, LinkingOptions, LocaleDirection, NavigationContainerProps, NavigationContainerRef } from '@react-navigation/native';
import React from 'react';
declare global {
    var REACT_NAVIGATION_DEVTOOLS: WeakMap<NavigationContainerRef<any>, {
        readonly linking: LinkingOptions<any>;
    }>;
}
type Props<ParamList extends object> = NavigationContainerProps & {
    direction?: LocaleDirection | undefined;
    linking?: LinkingOptions<ParamList> | undefined;
    fallback?: React.ReactNode | undefined;
    documentTitle?: DocumentTitleOptions | undefined;
};
export declare const NavigationContainer: <RootParamList extends object = ReactNavigation.RootParamList>(props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
}) => React.ReactElement;
export {};
//# sourceMappingURL=NavigationContainer.d.ts.map