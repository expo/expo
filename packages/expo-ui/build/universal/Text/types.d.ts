import type { UniversalBaseProps } from '../types';
/**
 * Font weight for text content. Accepts named values (`'normal'`, `'bold'`) or
 * numeric string values from `'100'` (thin) to `'900'` (black).
 */
export type UniversalFontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
/**
 * Text-specific styling options for the [`Text`](#text) component.
 */
export interface UniversalTextStyle {
    /**
     * Font size in points.
     */
    fontSize?: number;
    /**
     * Weight of the font.
     */
    fontWeight?: UniversalFontWeight;
    /**
     * Font family name.
     */
    fontFamily?: string;
    /**
     * Text color. Accepts any CSS color string.
     */
    color?: string;
    /**
     * Line height in points.
     *
     * On iOS this is approximated as `lineSpacing(lineHeight - fontSize)` because
     * SwiftUI only exposes a true `lineHeight(_:)` modifier on iOS 26+. For exact
     * spacing on iOS 26+ compose the `lineHeight` modifier from
     * `@expo/ui/swift-ui/modifiers` via the `modifiers` prop.
     */
    lineHeight?: number;
    /**
     * Spacing between characters in points.
     */
    letterSpacing?: number;
    /**
     * Horizontal alignment of the text.
     */
    textAlign?: 'left' | 'right' | 'center';
}
/**
 * Props for the [`Text`](#text) component.
 */
export interface TextProps extends UniversalBaseProps {
    /**
     * The text content to display.
     */
    children?: string;
    /**
     * Text-specific styling (font, color, alignment).
     */
    textStyle?: UniversalTextStyle;
    /**
     * Maximum number of lines to display. Text is truncated with an ellipsis when exceeded.
     */
    numberOfLines?: number;
}
//# sourceMappingURL=types.d.ts.map