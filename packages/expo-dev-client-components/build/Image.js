import { borderRadius, iconSize } from '@expo/styleguide-native';
import { Image as RNImage } from 'react-native';
import { create } from 'react-native-primitives';
export const Image = create(RNImage, {
    base: {
        resizeMode: 'cover',
    },
    variants: {
        size: {
            small: {
                height: iconSize.small,
                width: iconSize.small,
            },
            large: {
                height: iconSize.large,
                width: iconSize.large,
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
//# sourceMappingURL=Image.js.map