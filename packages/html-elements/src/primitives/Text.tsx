import { ComponentProps, ComponentType } from 'react';
import { Text as NativeText, TextStyle as NativeTextStyle } from 'react-native';

// https://github.com/necolas/react-native-web/issues/832

type NativeTextProps = ComponentProps<typeof NativeText>;

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

export type TextStyle = NativeTextStyle & WebTextStyle;

export interface WebTextProps {
  /** @platform web */
  tabIndex?: number;
  /** @platform web */
  style?: TextStyle;
}

export type TextProps = NativeTextProps & WebTextProps;

const Text = NativeText as ComponentType<TextProps>;

export default Text;
