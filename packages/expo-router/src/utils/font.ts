import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type ConvertedFontWeightType = Exclude<TextStyle['fontWeight'], number> | `${NumericFontWeight}`;

export function convertTextStyleToRNTextStyle<BaseStyleType extends Pick<TextStyle, 'fontWeight'>>(
  style: StyleProp<BaseStyleType | undefined>
):
  | (Omit<BaseStyleType, 'fontWeight'> & {
      fontWeight?: ConvertedFontWeightType;
    })
  | undefined {
  const flattenedStyle = StyleSheet.flatten(style) as BaseStyleType | undefined;
  if (!flattenedStyle) {
    return undefined;
  }
  if ('fontWeight' in flattenedStyle) {
    return {
      ...flattenedStyle,
      fontWeight:
        typeof flattenedStyle.fontWeight === 'number'
          ? (String(flattenedStyle.fontWeight) as `${NumericFontWeight}`)
          : flattenedStyle.fontWeight,
    };
  }
  return flattenedStyle as Omit<BaseStyleType, 'fontWeight'>;
}

export type BasicTextStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'fontFamily' | 'color'>;

/**
 * Font weights supported by Jetpack Compose text. Structurally identical to
 * `TextFontWeight` from `@expo/ui/jetpack-compose`.
 */
export type ComposeFontWeight = 'normal' | 'bold' | `${NumericFontWeight}`;

// Named weights follow React Native core's iOS equivalences (RCTFont):
// ultralight=100, thin=200, light=300, regular=400, medium=500, semibold=600,
// bold=700, heavy=800, black=900.
const COMPOSE_FONT_WEIGHTS: Record<string, ComposeFontWeight | undefined> = {
  normal: 'normal',
  bold: 'bold',
  '100': '100',
  '200': '200',
  '300': '300',
  '400': '400',
  '500': '500',
  '600': '600',
  '700': '700',
  '800': '800',
  '900': '900',
  ultralight: '100',
  thin: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  condensed: '400',
  condensedBold: '700',
  heavy: '800',
  black: '900',
};

export function convertFontWeightToComposeFontWeight(
  fontWeight: string | number | undefined
): ComposeFontWeight | undefined {
  if (fontWeight == null) {
    return undefined;
  }
  return COMPOSE_FONT_WEIGHTS[String(fontWeight)];
}
