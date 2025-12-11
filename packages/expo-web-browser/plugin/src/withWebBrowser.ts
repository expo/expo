import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

type PluginConfig = {
  experimentalLauncherActivity?: boolean;
};

const pkg = require('expo-web-browser/package.json');

const withWebBrowser: ConfigPlugin<PluginConfig | null> = (config, props) => {
  if (props?.experimentalLauncherActivity) {
    console.warn(
      'The `experimentalLauncherActivity` option has been removed. To achieve similar behaviour, set both `createTask` and `useProxyActivity` to true when using `openBrowserAsync` or `openAuthSessionAsync`.'
    );
    return config;
  }

  return config;
};

export default createRunOncePlugin(withWebBrowser, pkg.name, pkg.version);
