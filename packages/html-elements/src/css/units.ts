import { PixelRatio, Platform } from 'react-native';

export function rem(pixels: number): number | string {
  if (Platform.OS === 'web') return `${pixels}rem`;
  return PixelRatio.getFontScale() * 16 * pixels;
}

export function em(pixels: number): number | string {
  if (Platform.OS === 'web') return `${pixels}em`;
  return rem(pixels);
}
