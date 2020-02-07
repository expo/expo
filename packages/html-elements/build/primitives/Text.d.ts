import { ComponentProps, ComponentType } from 'react';
import { Text as NativeText, TextStyle as NativeTextStyle } from 'react-native';
declare type NativeTextProps = ComponentProps<typeof NativeText>;
export interface WebTextStyle {
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
export declare type TextStyle = NativeTextStyle & WebTextStyle;
export interface WebTextProps {
    /** @platform web */
    tabIndex?: number;
    /** @platform web */
    style?: TextStyle;
}
export declare type TextProps = NativeTextProps & WebTextProps;
declare const Text: ComponentType<TextProps>;
export default Text;
