import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import {
  AccessibilityRole,
  StyleProp,
  Text as NativeText,
  TextStyle as NativeTextStyle,
} from 'react-native';

// https://github.com/necolas/react-native-web/issues/832

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

export type TextStyle = Omit<NativeTextStyle, 'fontSize' | 'lineHeight'> & WebTextStyle;

export type WebTextProps = {
  style?: StyleProp<TextStyle>;
  /** @platform web */
  tabIndex?: number;
  accessibilityRole?: 'listitem' | AccessibilityRole;
};

export type TextProps = Omit<NativeTextProps, 'style' | 'accessibilityRole'> & WebTextProps;

const Text = NativeText as ComponentType<TextProps>;

export default Text;
