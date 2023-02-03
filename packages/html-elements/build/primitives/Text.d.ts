import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { AccessibilityRole, StyleProp, Text as NativeText, TextStyle as NativeTextStyle } from 'react-native';
import { WebViewStyle } from './View';
type NativeTextProps = ComponentProps<typeof NativeText> & ClassAttributes<typeof NativeText>;
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
export type TextStyle = Omit<NativeTextStyle, 'position' | 'fontSize' | 'lineHeight'> & WebTextStyle & WebViewStyle;
export type WebTextProps = {
    style?: StyleProp<TextStyle>;
    /** @platform web */
    tabIndex?: number;
    /** @platform web */
    accessibilityLevel?: number;
    accessibilityRole?: 'listitem' | 'heading' | AccessibilityRole;
    /** @platform web */
    href?: string;
    /** @deprecated use the prop `hrefAttrs={{ target: '...' }}` instead. */
    target?: string;
    /** @platform web */
    hrefAttrs?: {
        /** @platform web */
        target?: string;
        /** @platform web */
        rel?: string;
        /** @platform web */
        download?: boolean | string;
    };
    /** @platform web */
    lang?: string;
};
export type TextProps = Omit<NativeTextProps, 'style' | 'accessibilityRole'> & WebTextProps;
declare const _default: ComponentType<TextProps>;
export default _default;
//# sourceMappingURL=Text.d.ts.map