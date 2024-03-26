import { NavigationContainerProps, NavigationContainerRef } from '@react-navigation/core';
import { DocumentTitleOptions, LinkingOptions, Theme } from '@react-navigation/native';
import * as React from 'react';
declare global {
    var REACT_NAVIGATION_DEVTOOLS: WeakMap<NavigationContainerRef<any>, {
        readonly linking: LinkingOptions<any>;
    }>;
}
type Props<ParamList extends object> = NavigationContainerProps & {
    theme?: Theme;
    linking?: LinkingOptions<ParamList>;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions;
    onReady?: () => void;
};
declare const NavigationContainer: <RootParamList extends object = ReactNavigation.RootParamList>(props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
}) => React.ReactElement;
export default NavigationContainer;
//# sourceMappingURL=NavigationContainer.d.ts.map