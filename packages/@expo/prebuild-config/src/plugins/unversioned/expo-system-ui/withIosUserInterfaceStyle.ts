import { InfoPlist } from '@expo/config-plugins';
import { createInfoPlistPluginWithPropertyGuard } from '@expo/config-plugins/build/plugins/ios-plugins';
import { ExpoConfig } from '@expo/config-types';

export const withIosUserInterfaceStyle = createInfoPlistPluginWithPropertyGuard(
  setUserInterfaceStyle,
  {
    infoPlistProperty: 'UIUserInterfaceStyle',
    expoConfigProperty: 'userInterfaceStyle | ios.userInterfaceStyle',
    expoPropertyGetter: getUserInterfaceStyle,
  },
  'withIosUserInterfaceStyle'
);

export function getUserInterfaceStyle(
  config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>
): string {
  return config.ios?.userInterfaceStyle ?? config.userInterfaceStyle ?? 'light';
}

export function setUserInterfaceStyle(
  config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>,
  { UIUserInterfaceStyle, ...infoPlist }: InfoPlist
): InfoPlist {
  const userInterfaceStyle = getUserInterfaceStyle(config);
  const style = mapUserInterfaceStyleForInfoPlist(userInterfaceStyle);

  if (!style) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    UIUserInterfaceStyle: style,
  };
}

function mapUserInterfaceStyleForInfoPlist(
  userInterfaceStyle: string
): NonNullable<InfoPlist['UIUserInterfaceStyle']> | null {
  switch (userInterfaceStyle) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'automatic':
      return 'Automatic';
  }

  return null;
}
