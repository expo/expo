import { ExpoModifier } from '../../types';
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
 */
export type TextOverflow = 'clip' | 'ellipsis' | 'visible';
/**
 * Material 3 Typography scale styles.
 * Corresponds to MaterialTheme.typography in Jetpack Compose.
 */
export type TypographyStyle = 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'labelLarge' | 'labelMedium' | 'labelSmall';
/**
 * Text style properties that can be applied to text.
 * Corresponds to Jetpack Compose's TextStyle.
 */
export type TextStyle = {
    /**
     * Material 3 Typography style to use as the base style.
     * When specified, applies the predefined Material 3 typography style.
     * Other properties in this style object will override specific values from the typography.
     *
     * @example
     * ```tsx
     * style={{ typography: "bodyLarge" }}
     * style={{ typography: "headlineMedium", fontWeight: "bold" }}
     * ```
     */
    typography?: TypographyStyle;
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
     * The text decoration.
     */
    textDecoration?: TextDecoration;
    /**
     * The letter spacing in sp.
     */
    letterSpacing?: number;
    /**
     * The line height in sp.
     */
    lineHeight?: number;
};
export type TextProps = {
    /**
     * The text content to display.
     */
    children?: string | string[] | React.JSX.Element;
    /**
     * The color of the text.
     */
    color?: string;
    /**
     * The text alignment.
     */
    textAlign?: TextAlign;
    /**
     * How visual overflow should be handled.
     * - 'clip': Clips the overflowing text to fix its container
     * - 'ellipsis': Uses an ellipsis to indicate that the text has overflowed
     * - 'visible': Renders overflow text outside its container
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
    modifiers?: ExpoModifier[];
};
/**
 * Renders a Text component using Jetpack Compose.
 *
 * The Text component provides comprehensive text styling capabilities.
 * The API is aligned with Jetpack Compose's Text composable, where:
 * - Top-level props (color, textAlign, maxLines, etc.) match Compose's Text parameters
 * - `style` object corresponds to TextStyle, including typography, fontSize, fontWeight, etc.
 * - `style.typography` applies Material 3 typography styles (like MaterialTheme.typography)
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { Text } from 'expo-ui';
 *
 * <Text>Hello World</Text>
 * ```
 *
 * @example
 * Using Material 3 Typography (matches Jetpack Compose MaterialTheme.typography):
 * ```tsx
 * <Text style={{ typography: "bodyLarge" }}>Body text</Text>
 * <Text style={{ typography: "headlineMedium" }}>Headline</Text>
 * <Text style={{ typography: "titleSmall" }}>Small title</Text>
 * ```
 *
 * @example
 * Typography with style overrides:
 * ```tsx
 * <Text
 *   color="#007AFF"
 *   style={{
 *     typography: "bodyLarge",
 *     fontWeight: "bold"  // Override the typography's font weight
 *   }}
 * >
 *   Custom styled body text
 * </Text>
 * ```
 *
 * @example
 * With custom style object (matches Jetpack Compose TextStyle):
 * ```tsx
 * <Text
 *   color="#007AFF"
 *   textAlign="center"
 *   style={{
 *     fontSize: 18,
 *     fontWeight: "bold",
 *     letterSpacing: 1.2
 *   }}
 *   modifiers={[ExpoUI.padding(16)]}
 * >
 *   Styled text
 * </Text>
 * ```
 *
 * @example
 * Text truncation with ellipsis:
 * ```tsx
 * <Text
 *   maxLines={2}
 *   overflow="ellipsis"
 * >
 *   This is a very long text that will be truncated after two lines
 *   with an ellipsis at the end to indicate there's more content...
 * </Text>
 * ```
 */
export declare function Text(props: TextProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map