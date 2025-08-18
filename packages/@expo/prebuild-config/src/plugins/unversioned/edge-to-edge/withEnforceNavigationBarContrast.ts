import { ConfigPlugin, withAndroidStyles } from '@expo/config-plugins';

import { ResourceXMLConfig } from './withEdgeToEdge';

export const withEnforceNavigationBarContrast: ConfigPlugin<boolean> = (
  config,
  enforceNavigationBarContrast: boolean
) => {
  return withAndroidStyles(config, (config) => {
    return applyEnforceNavigationBarContrast(config, enforceNavigationBarContrast);
  });
};

export function applyEnforceNavigationBarContrast(
  config: ResourceXMLConfig,
  enforceNavigationBarContrast: boolean
): ResourceXMLConfig {
  const enforceNavigationBarContrastItem = {
    _: enforceNavigationBarContrast ? 'true' : 'false',
    $: {
      name: 'android:enforceNavigationBarContrast',
      'tools:targetApi': '29',
    },
  };
  const { style = [] } = config.modResults.resources;
  const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }
  const mainTheme = style[mainThemeIndex];
  const enforceIndex = mainTheme.item.findIndex(
    ({ $ }) => $.name === 'android:enforceNavigationBarContrast'
  );
  if (enforceIndex !== -1) {
    style[mainThemeIndex].item[enforceIndex] = enforceNavigationBarContrastItem;
    return config;
  }

  config.modResults.resources.style = [
    {
      $: style[mainThemeIndex].$,
      item: [enforceNavigationBarContrastItem, ...mainTheme.item],
    },
    ...style.filter(({ $ }) => $.name !== 'AppTheme'),
  ];

  return config;
}
