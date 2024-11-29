import { ExpoGoLogo, mergeClasses } from '@expo/styleguide';
import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { AtSignIcon } from '@expo/styleguide-icons/outline/AtSignIcon';

import { PlatformName } from '~/types/common';

export type PlatformIconProps = {
  platform?: PlatformName;
};

export const PlatformIcon = ({ platform }: PlatformIconProps) => {
  switch (platform) {
    case 'ios':
    case 'macos':
    case 'tvos':
      return (
        <AppleIcon
          className={mergeClasses(
            'icon-xs mt-[-0.5px] text-palette-blue12 opacity-80',
            platform === 'macos' && 'text-palette-purple12',
            platform === 'tvos' && 'text-palette-pink12'
          )}
        />
      );
    case 'android':
      return <AndroidIcon className="icon-xs mt-[-0.5px] text-palette-green12 opacity-80" />;
    case 'web':
      return <AtSignIcon className="icon-2xs text-palette-orange12 opacity-80" />;
    case 'expo':
      return <ExpoGoLogo className="icon-xs text-palette-purple12 opacity-80" />;
    default:
      return null;
  }
};
