import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { Text as NativeText, RegisteredStyle, RecursiveArray, TextStyle as NativeTextStyle } from 'react-native';
declare type NativeTextProps = ComponentProps<typeof NativeText> & ClassAttributes<typeof NativeText>;
export interface WebTextStyle {
    fontSize?: NativeTextStyle['fontSize'] | string;
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
export declare type TextStyle = Omit<NativeTextStyle, 'fontSize'> & WebTextStyle;
export declare type WebTextProps = {
    style?: false | TextStyle | RegisteredStyle<TextStyle> | RecursiveArray<false | TextStyle | RegisteredStyle<TextStyle> | null | undefined> | null;
    /** @platform web */
    tabIndex?: number;
    /** @platform web */
    href?: string;
    /** @platform web */
    target?: string;
};
export declare type TextProps = Omit<NativeTextProps, 'style'> & WebTextProps;
declare const Text: ComponentType<TextProps>;
export default Text;
