import { ExpoConfig } from 'expo/config';
import { InfoPlist, ConfigPlugin, withInfoPlist } from 'expo/config-plugins';

export const withIosUserInterfaceStyle: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults = setUserInterfaceStyle(config, config.modResults);
    return config;
  });
};

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
