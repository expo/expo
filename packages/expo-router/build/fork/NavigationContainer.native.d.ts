import { NavigationContainerProps, NavigationContainerRef } from '@react-navigation/core';
import { DocumentTitleOptions, LinkingOptions, Theme } from '@react-navigation/native';
import * as React from 'react';
type Props<ParamList extends object> = NavigationContainerProps & {
    theme?: Theme;
    linking?: LinkingOptions<ParamList>;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions;
    onReady?: () => void;
};
declare const NavigationContainer: <RootParamList extends object = ReactNavigation.RootParamList>(props: NavigationContainerProps & {
    theme?: Theme | undefined;
    linking?: LinkingOptions<RootParamList> | undefined;
    fallback?: React.ReactNode;
    documentTitle?: DocumentTitleOptions | undefined;
    onReady?: (() => void) | undefined;
} & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>> | undefined;
}) => React.ReactElement;
export default NavigationContainer;
//# sourceMappingURL=NavigationContainer.native.d.ts.map