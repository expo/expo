import type { ReactNode } from 'react';
import { type Animated, type ViewProps } from 'react-native';
export declare const MaybeScreenContainer: ({ enabled, ...rest }: ViewProps & {
    enabled: boolean;
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const MaybeScreen: ({ enabled, active, ...rest }: ViewProps & {
    enabled: boolean;
    active: 0 | 1 | Animated.AnimatedInterpolation<0 | 1>;
    children: ReactNode;
    freezeOnBlur?: boolean;
    shouldFreeze: boolean;
    homeIndicatorHidden?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Screens.d.ts.map