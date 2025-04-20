import { ConfigPlugin, withAndroidStyles } from '@expo/config-plugins';

import { ResourceXMLConfig } from './withEdgeToEdge';

const OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE = 'android:windowOptOutEdgeToEdgeEnforcement';

export const withConfigureEdgeToEdgeEnforcement: ConfigPlugin<{
  disableEdgeToEdgeEnforcement: boolean;
}> = (config, { disableEdgeToEdgeEnforcement }) => {
  return withAndroidStyles(config, (config) => {
    return configureEdgeToEdgeEnforcement(config, disableEdgeToEdgeEnforcement);
  });
};

export function configureEdgeToEdgeEnforcement(
  config: ResourceXMLConfig,
  disableEdgeToEdgeEnforcement: boolean
): ResourceXMLConfig {
  const { style = [] } = config.modResults.resources;

  const disableEdgeToEdgeEnforcementItem = {
    _: 'true',
    $: {
      name: OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE,
      'tools:targetApi': '35',
    },
  };

  const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');

  if (mainThemeIndex === -1) {
    return config;
  }

  const existingItem = style[mainThemeIndex].item.filter(
    ({ $ }) => $.name !== OPT_OUT_EDGE_TO_EDGE_ATTRIBUTE
  );

  if (disableEdgeToEdgeEnforcement) {
    existingItem.push(disableEdgeToEdgeEnforcementItem);
  }
  if (!config.modResults.resources.style) {
    return config;
  }

  config.modResults.resources.style[mainThemeIndex].item = existingItem;
  return config;
}
