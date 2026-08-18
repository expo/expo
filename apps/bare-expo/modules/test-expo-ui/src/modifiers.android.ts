import { createModifier } from '@expo/ui/jetpack-compose/modifiers';
import { type ColorValue } from 'react-native';

export const customBorder = (params: {
  color?: ColorValue;
  width?: number;
  cornerRadius?: number;
}) => createModifier('customBorder', params);
