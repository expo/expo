import { ConfigPlugin, createRunOncePlugin, withPodfileProperties } from 'expo/config-plugins';

const pkg = require('../../package.json');

type Props = {
  /** Disable linking the included libdav1d decoder. Useful when another dependency already provides it. */
  disableLibdav1d?: boolean;
};

const withExpoImage: ConfigPlugin<Props | void> = (config, props) => {
  const disableLibdav1d = props?.disableLibdav1d ?? false;

  return withPodfileProperties(config, (config) => {
    config.modResults['expo-image.disable-libdav1d'] = disableLibdav1d ? 'true' : 'false';
    return config;
  });
};

export default createRunOncePlugin(withExpoImage, pkg.name, pkg.version);
