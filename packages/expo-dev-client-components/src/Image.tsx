import { borderRadius, iconSize } from '@expo/styleguide-native';
import { Image as RNImage } from 'react-native';
import { create } from 'react-native-primitives';

import { scale } from './theme';

export const Image = create(RNImage, {
  base: {
    resizeMode: 'cover',
  },

  variants: {
    size: {
      tiny: {
        height: scale.small,
        width: scale.small,
      },
      small: {
        height: iconSize.small,
        width: iconSize.small,
      },

      large: {
        height: iconSize.large,
        width: iconSize.large,
      },

      xl: {
        height: scale.xl,
        width: scale.xl,
      },
    },

    rounded: {
      small: { borderRadius: borderRadius.small },
      medium: { borderRadius: borderRadius.medium },
      large: { borderRadius: borderRadius.large },
      huge: { borderRadius: borderRadius.huge },
      full: { borderRadius: 99999 },
    },
  },
});
