import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type ConvertedFontWeightType = Exclude<TextStyle['fontWeight'], number> | `${NumericFontWeight}`;

export function convertTextStyleToRNTextStyle<
  BaseStyleType extends Pick<TextStyle, 'fontSize' | 'fontWeight'>,
>(
  style: StyleProp<BaseStyleType | undefined>
):
  | (Omit<BaseStyleType, 'fontSize' | 'fontWeight'> & {
      fontSize?: number;
      fontWeight?: ConvertedFontWeightType;
    })
  | undefined {
  const flattenedStyle = StyleSheet.flatten(style) as BaseStyleType | undefined;
  if (!flattenedStyle) {
    return undefined;
  }
  const { fontSize, fontWeight, ...rest } = flattenedStyle;
  return {
    ...rest,
    ...(typeof fontSize === 'number' ? { fontSize } : null),
    ...('fontWeight' in flattenedStyle
      ? {
          fontWeight:
            typeof fontWeight === 'number'
              ? (String(fontWeight) as `${NumericFontWeight}`)
              : fontWeight,
        }
      : null),
  };
}

export type BasicTextStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'fontFamily' | 'color'>;

export type ComposeFontWeight = 'normal' | 'bold' | `${NumericFontWeight}`;

const SUPPORTED_FONT_WEIGHTS = new Set([
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'normal',
  'bold',
]);

export function convertFontWeightToComposeFontWeight(
  fontWeight: string | number | undefined
): ComposeFontWeight | undefined {
  if (fontWeight == null) {
    return undefined;
  }
  const value = String(fontWeight);
  if (!SUPPORTED_FONT_WEIGHTS.has(value)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Unsupported fontWeight "${value}". Supported values are 100–900, "normal", and "bold".`
      );
    }
    return undefined;
  }
  return value as ComposeFontWeight;
}
