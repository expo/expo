import { Platform } from 'react-native';

export function rem(value: number): number | string {
  if (Platform.OS === 'web') return `${value}rem`;
  return 16 * value;
}

export function em(value: number): number | string {
  if (Platform.OS === 'web') return `${value}em`;
  return rem(value);
}
