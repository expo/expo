import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withAssetsAndroid } from './withAssetsAndroid';
import { withAssetsIos } from './withAssetsIos';

const pkg = require('expo-asset/package.json');

export type WithAssetProps = {
  assets?: string[];
};

/**
 * @deprecated Use `WithAssetProps` instead.
 */
export type AssetProps = WithAssetProps;

const withAssets: ConfigPlugin<WithAssetProps | void> = (config, props) => {
  if (!props) {
    return config;
  }

  if (props.assets && props.assets.length === 0) {
    return config;
  }

  config = withAssetsIos(config, props.assets ?? []);
  config = withAssetsAndroid(config, props.assets ?? []);

  return config;
};

export default createRunOncePlugin(withAssets, pkg.name, pkg.version);
