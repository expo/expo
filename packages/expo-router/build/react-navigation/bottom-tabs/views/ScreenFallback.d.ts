import type { ReactNode } from 'react';
import { Animated, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
type Props = {
    enabled: boolean;
    active: 0 | 1 | 2 | Animated.AnimatedInterpolation<0 | 1>;
    children: ReactNode;
    freezeOnBlur?: boolean;
    shouldFreeze: boolean;
    style?: StyleProp<ViewStyle>;
};
export declare const MaybeScreenContainer: ({ enabled, ...rest }: ViewProps & {
    enabled: boolean;
    hasTwoStates: boolean;
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare function MaybeScreen({ enabled, active, ...rest }: ViewProps & Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ScreenFallback.d.ts.map