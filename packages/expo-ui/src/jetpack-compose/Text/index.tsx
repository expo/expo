import { requireNativeView } from 'expo';
import * as React from 'react';

import { type ModifierConfig } from '../../types';
import { getTextFromChildren } from '../../utils';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Font weight options for text styling.
 */
export type TextFontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

/**
 * Font style options for text styling.
 */
export type TextFontStyle = 'normal' | 'italic';

/**
 * Text alignment options.
 */
export type TextAlign = 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';

/**
 * Text decoration options.
 */
export type TextDecoration = 'none' | 'underline' | 'lineThrough';

/**
 * Text overflow behavior options.
 * - 'clip': Clips the overflowing text to fit its container
 * - 'ellipsis': Uses an ellipsis to indicate that the text has overflowed
 * - 'visible': Renders overflow text outside its container
 */
export type TextOverflow = 'clip' | 'ellipsis' | 'visible';

/**
 * Line break strategy options.
 * - 'simple': Basic line breaking.
 * - 'heading': Optimized for short text like headings.
 * - 'paragraph': Produces more balanced line lengths for body text.
 */
export type TextLineBreak = 'simple' | 'heading' | 'paragraph';

/**
 * Font family for text styling.
 * Built-in system families: 'default', 'sansSerif', 'serif', 'monospace', 'cursive'.
 * Custom font families loaded via expo-font can be referenced by name (for example, 'Inter-Bold').
 */
export type TextFontFamily =
  | 'default'
  | 'sansSerif'
  | 'serif'
  | 'monospace'
  | 'cursive'
  | (string & {});

/**
 * Text shadow configuration.
 * Corresponds to Jetpack Compose's Shadow class.
 */
export type TextShadow = {
  /**
   * The color of the shadow.
   */
  color?: string;
  /**
   * The horizontal offset of the shadow in dp.
   */
  offsetX?: number;
  /**
   * The vertical offset of the shadow in dp.
   */
  offsetY?: number;
  /**
   * The blur radius of the shadow in dp.
   */
  blurRadius?: number;
};

/**
 * Material 3 Typography scale styles.
 * Corresponds to MaterialTheme.typography in Jetpack Compose.
 */
export type TypographyStyle =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

/**
 * Shared span-level style properties used by both `TextStyle` and `TextSpanRecord`.
 * Adding a property here ensures it's available on both parent text and nested spans.
 */
export type TextSpanStyleBase = {
  /**
   * The font size in sp (scale-independent pixels).
   */
  fontSize?: number;

  /**
   * The font weight of the text.
   */
  fontWeight?: TextFontWeight;

  /**
   * The font style of the text.
   */
  fontStyle?: TextFontStyle;

  /**
   * The font family.
   */
  fontFamily?: TextFontFamily;

  /**
   * The text decoration.
   */
  textDecoration?: TextDecoration;

  /**
   * The letter spacing in sp.
   */
  letterSpacing?: number;

  /**
   * The background color behind the text.
   */
  background?: string;

  /**
   * The shadow applied to the text.
   */
  shadow?: TextShadow;
};

/**
 * Text style properties that can be applied to text.
 * Corresponds to Jetpack Compose's `TextStyle`.
 */
export type TextStyle = TextSpanStyleBase & {
  /**
   * Material 3 Typography style to use as the base style.
   * When specified, applies the predefined Material 3 typography style.
   * Other properties in this style object will override specific values from the typography.
   */
  typography?: TypographyStyle;

  /**
   * The text alignment.
   */
  textAlign?: TextAlign;

  /**
   * The line height in sp.
   */
  lineHeight?: number;

  /**
   * The line break strategy.
   */
  lineBreak?: TextLineBreak;
};

/**
 * A record representing a styled text span, sent to the native side.
 * Can be a leaf (has `text`) or a branch (has `children`).
 * Style inheritance is handled natively via nested `withStyle` on the Kotlin side.
 */
type TextSpanRecord = TextSpanStyleBase & {
  text?: string;
  color?: string;
  children?: TextSpanRecord[];
};

export type TextProps = {
  /**
   * The text content to display. Can be a string, number, or nested `Text` components
   * for inline styled spans.
   */
  children?: React.ReactNode;

  /**
   * The color of the text.
   */
  color?: string;

  /**
   * How visual overflow should be handled.
   */
  overflow?: TextOverflow;

  /**
   * Whether the text should break at soft line breaks.
   * If false, the glyphs in the text will be positioned as if there was unlimited horizontal space.
   */
  softWrap?: boolean;

  /**
   * An optional maximum number of lines for the text to span, wrapping if necessary.
   * If the text exceeds the given number of lines, it will be truncated according to overflow.
   */
  maxLines?: number;

  /**
   * The minimum height in terms of minimum number of visible lines.
   */
  minLines?: number;

  /**
   * Style configuration for the text.
   * Corresponds to Jetpack Compose's TextStyle parameter.
   */
  style?: TextStyle;

  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeTextProps = Omit<TextProps, 'children' | 'style'> &
  TextSpanStyleBase & {
    text?: string;
    spans?: TextSpanRecord[];
    typography?: TypographyStyle;
    textAlign?: TextAlign;
    lineHeight?: number;
    lineBreak?: TextLineBreak;
  };

const TextNativeView: React.ComponentType<NativeTextProps> = requireNativeView(
  'ExpoUI',
  'TextView'
);

// Constructs tree of spans from nested Text components
function collectSpans(children: React.ReactNode): TextSpanRecord[] | null {
  if (children === undefined || children === null) return null;

  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return null;

  const hasNestedText = childArray.some(
    (child) => React.isValidElement(child) && child.type === Text
  );

  if (!hasNestedText) return null;

  const spans: TextSpanRecord[] = [];

  for (const child of childArray) {
    if (typeof child === 'string') {
      spans.push({ text: child });
    } else if (typeof child === 'number') {
      spans.push({ text: String(child) });
    } else if (React.isValidElement(child) && child.type === Text) {
      const childProps = child.props as TextProps;
      const span: TextSpanRecord = {
        color: childProps.color,
        fontSize: childProps.style?.fontSize,
        fontWeight: childProps.style?.fontWeight,
        fontStyle: childProps.style?.fontStyle,
        fontFamily: childProps.style?.fontFamily,
        textDecoration: childProps.style?.textDecoration,
        letterSpacing: childProps.style?.letterSpacing,
        background: childProps.style?.background,
        shadow: childProps.style?.shadow,
      };

      const nestedSpans = collectSpans(childProps.children);
      if (nestedSpans) {
        span.children = nestedSpans;
      } else {
        span.text = getTextFromChildren(childProps.children) ?? '';
      }

      spans.push(span);
    } else if (__DEV__ && React.isValidElement(child)) {
      console.warn(
        'Text: Unsupported child element of type "%s" inside <Text>. Only <Text>, string, and number children are supported.',
        typeof child.type === 'function' ? child.type.name || 'Unknown' : child.type
      );
    }
  }

  return spans.length > 0 ? spans : null;
}

function transformTextProps(props: TextProps): NativeTextProps {
  const { children, modifiers, style, ...restProps } = props;

  const spans = collectSpans(children);

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    // When spans are present, use them instead of flat text
    ...(spans ? { spans } : { text: getTextFromChildren(children) ?? '' }),
    // Extract typography from style (used as base style)
    typography: style?.typography,
    // Flatten other style properties (these override the typography style)
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight,
    fontStyle: style?.fontStyle,
    fontFamily: style?.fontFamily,
    textAlign: style?.textAlign,
    textDecoration: style?.textDecoration,
    letterSpacing: style?.letterSpacing,
    lineHeight: style?.lineHeight,
    lineBreak: style?.lineBreak,
    background: style?.background,
    shadow: style?.shadow,
  };
}

/**
 * Renders a Text component using Jetpack Compose.
 */
export function Text(props: TextProps) {
  return <TextNativeView {...transformTextProps(props)} />;
}
