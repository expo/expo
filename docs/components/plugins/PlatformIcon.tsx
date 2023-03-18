import { ExpoGoLogo } from '@expo/styleguide';
import { AndroidIcon, AppleIcon, AtSignIcon } from '@expo/styleguide-icons';

import { PlatformName } from '~/types/common';

export type PlatformIconProps = {
  platform?: PlatformName;
};

export const PlatformIcon = ({ platform }: PlatformIconProps) => {
  switch (platform) {
    case 'ios':
      return <AppleIcon className="icon-xs text-palette-blue12" />;
    case 'android':
      return <AndroidIcon className="icon-xs text-palette-green12" />;
    case 'web':
      return <AtSignIcon className="icon-xs text-palette-orange12" />;
    case 'expo':
      return <ExpoGoLogo className="icon-xs text-palette-purple12" />;
    default:
      return null;
  }
};
