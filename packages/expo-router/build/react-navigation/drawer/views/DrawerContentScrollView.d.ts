import * as React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
type Props = ScrollViewProps & {
    ref?: React.Ref<ScrollView>;
    children: React.ReactNode;
};
declare function DrawerContentScrollViewInner({ ref, contentContainerStyle, style, children, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export declare const DrawerContentScrollView: typeof DrawerContentScrollViewInner;
export {};
//# sourceMappingURL=DrawerContentScrollView.d.ts.map