import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withFontsAndroid } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('expo-font/package.json');

export type FontProps = {
  fonts?: string[];
  android?: {
    fonts?: string[];
  };
  ios?: {
    fonts?: string[];
  };
};

const withFonts: ConfigPlugin<FontProps> = (config, props) => {
  if (!props) {
    return config;
  }

  const iosFonts = [...(props.fonts ?? []), ...(props.ios?.fonts ?? [])];

  if (iosFonts.length > 0) {
    config = withFontsIos(config, iosFonts);
  }

  const androidFonts = [...(props.fonts ?? []), ...(props.android?.fonts ?? [])];

  if (androidFonts.length > 0) {
    config = withFontsAndroid(config, androidFonts);
  }

  return config;
};

export default createRunOncePlugin(withFonts, pkg.name, pkg.version);
