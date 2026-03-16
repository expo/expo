import { type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface StackToolbarLabelProps {
    /**
     * The text to display as the label for the tab.
     */
    children?: string | undefined;
}
export declare const StackToolbarLabel: React.FC<StackToolbarLabelProps>;
export type StackToolbarIconProps = {
    src: ImageSourcePropType;
    /**
     * Controls how the image icon is rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon
     * - `'original'`: Preserves original icon colors
     *
     * Defaults based on parent component's `tintColor`:
     * - With `tintColor`: defaults to `'template'`
     * - Without `tintColor`: defaults to `'original'`
     *
     * @platform ios
     */
    renderingMode?: 'template' | 'original' | undefined;
} | {
    sf: SFSymbol;
} | {
    /**
     * Name of an image in your Xcode asset catalog (`.xcassets`).
     *
     * @platform ios
     */
    xcasset: string;
    /**
     * Controls how the xcasset icon is rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon
     * - `'original'`: Preserves original icon colors
     *
     * Defaults based on parent component's `tintColor`:
     * - With `tintColor`: defaults to `'template'`
     * - Without `tintColor`: defaults to `'original'`
     *
     * @platform ios
     */
    renderingMode?: 'template' | 'original' | undefined;
};
export declare const StackToolbarIcon: React.FC<StackToolbarIconProps>;
export interface StackToolbarBadgeProps {
    /**
     * The text to display as the badge
     */
    children?: string | undefined;
    style?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'color' | 'fontWeight' | 'backgroundColor'>> | undefined;
}
export declare const StackToolbarBadge: React.FC<StackToolbarBadgeProps>;
//# sourceMappingURL=toolbar-primitives.d.ts.map