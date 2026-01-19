import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface StackToolbarLabelProps {
    /**
     * The text to display as the label for the tab.
     */
    children?: string;
}
export declare const StackToolbarLabel: React.FC<StackToolbarLabelProps>;
export type StackToolbarIconProps = {
    src: ImageSourcePropType;
} | {
    sf: SFSymbol;
};
export declare const StackToolbarIcon: React.FC<StackToolbarIconProps>;
export interface StackToolbarBadgeProps {
    /**
     * The text to display as the badge
     */
    children?: string;
    style?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'color' | 'fontWeight' | 'backgroundColor'>>;
}
export declare const StackToolbarBadge: React.FC<StackToolbarBadgeProps>;
//# sourceMappingURL=common-primitives.d.ts.map