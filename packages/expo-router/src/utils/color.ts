import OriginalColor from 'color';
import type { ColorValue } from 'react-native';

export function Color(value: ColorValue): ReturnType<typeof OriginalColor> | undefined {
  if (typeof value === 'string' && !value.startsWith('var(')) {
    return OriginalColor(value);
  }

  return undefined;
}
