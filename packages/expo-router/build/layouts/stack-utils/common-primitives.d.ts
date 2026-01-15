import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface StackHeaderLabelProps {
    /**
     * The text to display as the label for the tab.
     */
    children?: string;
}
export declare const StackHeaderLabel: React.FC<StackHeaderLabelProps>;
export type StackHeaderIconProps = {
    src: ImageSourcePropType;
} | {
    sf: SFSymbol;
};
export declare const StackHeaderIcon: React.FC<StackHeaderIconProps>;
export interface StackHeaderBadgeProps {
    /**
     * The text to display as the badge
     */
    children?: string;
    style?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'color' | 'fontWeight' | 'backgroundColor'>>;
}
export declare const StackHeaderBadge: React.FC<StackHeaderBadgeProps>;
//# sourceMappingURL=common-primitives.d.ts.map