import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin } from '../Plugin.types';
import { withAndroidColors, withAndroidStyles } from '../plugins/android-plugins';
import { assignColorValue } from './Colors';
import { assignStylesValue, getAppThemeLightNoActionBarGroup } from './Styles';

const COLOR_PRIMARY_KEY = 'colorPrimary';
const DEFAULT_PRIMARY_COLOR = '#023c69';

export const withPrimaryColor: ConfigPlugin = config => {
  config = withPrimaryColorColors(config);
  config = withPrimaryColorStyles(config);
  return config;
};

export const withPrimaryColorColors: ConfigPlugin = config => {
  return withAndroidColors(config, config => {
    config.modResults = assignColorValue(config.modResults, {
      name: COLOR_PRIMARY_KEY,
      value: getPrimaryColor(config),
    });
    return config;
  });
};

export const withPrimaryColorStyles: ConfigPlugin = config => {
  return withAndroidStyles(config, config => {
    config.modResults = assignStylesValue(config.modResults, {
      add: !!getPrimaryColor(config),
      parent: getAppThemeLightNoActionBarGroup(),
      name: COLOR_PRIMARY_KEY,
      value: `@color/${COLOR_PRIMARY_KEY}`,
    });
    return config;
  });
};

export function getPrimaryColor(config: Pick<ExpoConfig, 'primaryColor'>) {
  return config.primaryColor ?? DEFAULT_PRIMARY_COLOR;
}
