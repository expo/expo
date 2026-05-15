import * as React from 'react';
import { Animated, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { HeaderSearchBarOptions, HeaderSearchBarRef } from '../types';
type Props = Omit<HeaderSearchBarOptions, 'ref'> & {
    visible: boolean;
    onClose: () => void;
    tintColor?: ColorValue;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
};
declare function HeaderSearchBarInternal({ ref, visible, inputType, autoFocus, autoCapitalize, placeholder, cancelButtonText, enterKeyHint, onChangeText, onClose, tintColor, style, ...rest }: Props & {
    ref?: React.Ref<HeaderSearchBarRef>;
}): import("react/jsx-runtime").JSX.Element | null;
export declare const HeaderSearchBar: typeof HeaderSearchBarInternal;
export {};
//# sourceMappingURL=HeaderSearchBar.d.ts.map