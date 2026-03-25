import * as React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import type { HeaderSearchBarOptions, HeaderSearchBarRef } from '../types';
export declare const HeaderSearchBar: React.ForwardRefExoticComponent<Omit<HeaderSearchBarOptions, "ref"> & {
    visible: boolean;
    onClose: () => void;
    tintColor?: string;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
} & React.RefAttributes<HeaderSearchBarRef>>;
//# sourceMappingURL=HeaderSearchBar.d.ts.map