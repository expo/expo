import * as React from 'react';
import { type ModifierConfig } from '../../types';
/**
 * Font weight options for text styling.
 */
export type TextFontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
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
export type TextFontFamily = 'default' | 'sansSerif' | 'serif' | 'monospace' | 'cursive' | (string & {});
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
export type TypographyStyle = 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'labelLarge' | 'labelMedium' | 'labelSmall';
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
/**
 * Renders a Text component using Jetpack Compose.
 */
export declare function Text(props: TextProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map