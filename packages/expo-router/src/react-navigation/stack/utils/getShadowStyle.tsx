import { type ColorValue, Platform, type ViewStyle } from 'react-native';

import { alpha } from '../../../utils/color';

type ShadowConfig = {
  offset: {
    width: number;
    height: number;
  };
  radius: number;
  opacity: number;
  color?: ColorValue;
};

export function getShadowStyle({
  offset,
  radius,
  opacity,
  color = '#000',
}: ShadowConfig): ViewStyle {
  const result = Platform.select({
    web: {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${alpha(color, opacity) ?? ''}`,
    },
    default: {
      shadowOffset: offset,
      shadowRadius: radius,
      shadowColor: color,
      shadowOpacity: opacity,
    },
  });

  return result;
}
