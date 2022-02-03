import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { AccessibilityRole, StyleProp, Text as NativeText, TextStyle as NativeTextStyle } from 'react-native';
declare type NativeTextProps = ComponentProps<typeof NativeText> & ClassAttributes<typeof NativeText>;
export interface WebTextStyle {
    /** string is only available on web */
    fontSize?: NativeTextStyle['fontSize'] | string;
    /** string is only available on web */
    lineHeight?: NativeTextStyle['lineHeight'] | string;
    /** @platform web */
    fontFeatureSettings?: string;
    /** @platform web */
    textIndent?: string;
    /** @platform web */
    textOverflow?: string;
    /** @platform web */
    textRendering?: string;
    /** @platform web */
    textTransform?: string;
    /** @platform web */
    unicodeBidi?: string;
    /** @platform web */
    wordWrap?: string;
}
export declare type TextStyle = Omit<NativeTextStyle, 'fontSize' | 'lineHeight'> & WebTextStyle;
export declare type WebTextProps = {
    style?: StyleProp<TextStyle>;
    /** @platform web */
    tabIndex?: number;
    accessibilityRole?: 'listitem' | AccessibilityRole;
};
export declare type TextProps = Omit<NativeTextProps, 'style' | 'accessibilityRole'> & WebTextProps;
declare const Text: ComponentType<TextProps>;
export default Text;
//# sourceMappingURL=Text.d.ts.map