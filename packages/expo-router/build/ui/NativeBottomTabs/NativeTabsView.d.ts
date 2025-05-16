import { DefaultRouterOptions, ParamListBase, TabNavigationState, TabRouterOptions, useNavigationBuilder } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';
export interface NativeTabProps extends DefaultRouterOptions {
    label: string;
}
export type NativeTabsViewProps = {
    builder: ReturnType<typeof useNavigationBuilder<TabNavigationState<ParamListBase>, TabRouterOptions, Record<string, (...args: any) => void>, NativeTabProps, Record<string, any>>>;
};
export declare function NativeTabsView(props: PropsWithChildren<NativeTabsViewProps>): React.JSX.Element;
//# sourceMappingURL=NativeTabsView.d.ts.map