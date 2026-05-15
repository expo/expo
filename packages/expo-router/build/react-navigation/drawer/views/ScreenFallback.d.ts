import * as React from 'react';
import { type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
type Props = {
    visible: boolean;
    children: React.ReactNode;
    enabled: boolean;
    freezeOnBlur?: boolean;
    shouldFreeze: boolean;
    style?: StyleProp<ViewStyle>;
};
export declare const MaybeScreenContainer: ({ enabled, ...rest }: ViewProps & {
    enabled: boolean;
    hasTwoStates: boolean;
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare function MaybeScreen({ visible, children, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ScreenFallback.d.ts.map