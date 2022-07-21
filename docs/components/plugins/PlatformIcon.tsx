import { AndroidIcon, AppleIcon, AtSignIcon, ExpoGoLogo, iconSize, theme } from '@expo/styleguide';

import { PlatformName } from '~/types/common';

export type PlatformIconProps = {
  platform?: PlatformName;
};

export const PlatformIcon = ({ platform }: PlatformIconProps) => {
  const size = iconSize.micro;

  switch (platform) {
    case 'ios':
      return <AppleIcon color={theme.palette.blue['900']} size={size} />;
    case 'android':
      return <AndroidIcon color={theme.palette.green['900']} size={size} />;
    case 'web':
      return <AtSignIcon color={theme.palette.orange['900']} size={size} />;
    case 'expo':
      return (
        <ExpoGoLogo
          width={iconSize.micro}
          height={iconSize.micro}
          color={theme.palette.purple['900']}
          size={size}
        />
      );
    default:
      return null;
  }
};
