import { ConfigPlugin, createRunOncePlugin, withPodfileProperties } from 'expo/config-plugins';

const pkg = require('../../package.json');

export type Props = {
  /**
   * Enable the native AVIF coder backed by libavif and libdav1d.
   * @default false
   * @platform ios
   */
  enableAvifCoder?: boolean;
  /**
   * Enable the native WebP coder backed by libwebp.
   * @default false
   * @platform ios
   */
  enableWebPCoder?: boolean;
  /**
   * Disable linking the included libdav1d decoder. Useful when another dependency already provides it.
   * @default false
   * @platform ios
   */
  disableLibdav1d?: boolean;
};

const withExpoImage: ConfigPlugin<Props | void> = (config, props) => {
  const enableAvifCoder = props?.enableAvifCoder ?? false;
  const enableWebPCoder = props?.enableWebPCoder ?? false;
  const disableLibdav1d = props?.disableLibdav1d ?? false;

  return withPodfileProperties(config, (config) => {
    config.modResults['expo-image.enable-avif-coder'] = enableAvifCoder ? 'true' : 'false';
    config.modResults['expo-image.enable-webp-coder'] = enableWebPCoder ? 'true' : 'false';
    config.modResults['expo-image.disable-libdav1d'] = disableLibdav1d ? 'true' : 'false';
    return config;
  });
};

export default createRunOncePlugin(withExpoImage, pkg.name, pkg.version);
