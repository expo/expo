import * as React from 'react';
import { Animated, type ViewProps } from 'react-native';
export declare const MaybeScreenContainer: ({ enabled, ...rest }: ViewProps & {
    enabled: boolean;
    children: React.ReactNode;
}) => React.JSX.Element;
export declare const MaybeScreen: ({ enabled, active, ...rest }: ViewProps & {
    enabled: boolean;
    active: 0 | 1 | Animated.AnimatedInterpolation<0 | 1>;
    children: React.ReactNode;
    freezeOnBlur?: boolean;
    shouldFreeze: boolean;
    homeIndicatorHidden?: boolean;
}) => React.JSX.Element;
//# sourceMappingURL=Screens.d.ts.map