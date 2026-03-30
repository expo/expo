import { type ColorValue, Platform } from 'react-native';

import { Color } from '../../../utils/color';

type ShadowConfig = {
  offset: {
    width: number;
    height: number;
  };
  radius: number;
  opacity: number;
  color?: ColorValue;
};

export function getShadowStyle({ offset, radius, opacity, color = '#000' }: ShadowConfig) {
  const result = Platform.select({
    web: {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${
        Color(color)?.alpha(opacity).toString() ?? ''
      }`,
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
