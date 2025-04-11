import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withWebBrowserAndroid, PluginConfig } from './withWebBrowserAndroid';

const pkg = require('expo-web-browser/package.json');

const withWebBrowser: ConfigPlugin<PluginConfig | null> = (config, props) => {
  if (!props) {
    return config;
  }

  if (!props.experimentalLauncherActivity) {
    return config;
  }

  return withWebBrowserAndroid(config);
};

export default createRunOncePlugin(withWebBrowser, pkg.name, pkg.version);
