import { AndroidIcon, AppleIcon, AtSignIcon, ExpoGoLogo, iconSize, theme } from '@expo/styleguide';

import { PlatformName } from '~/types/common';

export type PlatformIconProps = {
  platform?: PlatformName;
};

export const PlatformIcon = ({ platform }: PlatformIconProps) => {
  const size = iconSize['2xs'];

  switch (platform) {
    case 'ios':
      return <AppleIcon color={theme.palette.blue12} size={size} />;
    case 'android':
      return <AndroidIcon color={theme.palette.green12} size={size} />;
    case 'web':
      return <AtSignIcon color={theme.palette.orange12} size={size} />;
    case 'expo':
      return (
        <ExpoGoLogo
          width={iconSize['2xs']}
          height={iconSize['2xs']}
          color={theme.palette.purple12}
          size={size}
        />
      );
    default:
      return null;
  }
};
