import type { TextStyle } from 'react-native';

export function convertFontWeightToStringFontWeight(
  fontWeight: TextStyle['fontWeight']
): Exclude<TextStyle['fontWeight'], number> | undefined {
  if (typeof fontWeight === 'number') {
    return String(fontWeight) as `${Extract<TextStyle['fontWeight'], number>}`;
  }
  return fontWeight;
}
