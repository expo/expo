import { ConfigPlugin, withAndroidStyles } from '@expo/config-plugins';

import { ResourceXMLConfig } from './withEdgeToEdge';

export const withRestoreDefaultTheme: ConfigPlugin = (config) => {
  // Default theme for SDK 53 and onwards projects
  return withAndroidStyles(config, (config) => {
    return restoreDefaultTheme(config);
  });
};

export function restoreDefaultTheme(config: ResourceXMLConfig): ResourceXMLConfig {
  const DEFAULT_THEME = 'Theme.AppCompat.DayNight.NoActionBar';

  const { style = [] } = config.modResults.resources;
  const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }

  if (style[mainThemeIndex].$?.parent.includes('EdgeToEdge')) {
    config.modResults.resources.style = [
      {
        $: {
          name: 'AppTheme',
          parent: DEFAULT_THEME,
        },
        item: style[mainThemeIndex].item,
      },
      ...style.filter(({ $ }) => $.name !== 'AppTheme'),
    ];
  }
  return config;
}
