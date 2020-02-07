import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import {
  Text as NativeText,
  RegisteredStyle,
  RecursiveArray,
  TextStyle as NativeTextStyle,
} from 'react-native';

// https://github.com/necolas/react-native-web/issues/832

type NativeTextProps = ComponentProps<typeof NativeText> & ClassAttributes<typeof NativeText>;

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

export type TextStyle = Omit<NativeTextStyle, 'fontSize'> & WebTextStyle;

export type WebTextProps = {
  style?:
    | false
    | TextStyle
    | RegisteredStyle<TextStyle>
    | RecursiveArray<false | TextStyle | RegisteredStyle<TextStyle> | null | undefined>
    | null;
  /** @platform web */
  tabIndex?: number;
  /** @platform web */
  href?: string;
  /** @platform web */
  target?: string;
};

export type TextProps = Omit<NativeTextProps, 'style'> & WebTextProps;

const Text = NativeText as ComponentType<TextProps>;

export default Text;
