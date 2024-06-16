import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withFontsAndroid } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('expo-font/package.json');

export type FontProps = {
  fonts?: string[];
};

const withFonts: ConfigPlugin<FontProps> = (config, props) => {
  if (!props) {
    return config;
  }

  if (props.fonts && props.fonts.length === 0) {
    return config;
  }

  config = withFontsIos(config, props.fonts ?? []);
  config = withFontsAndroid(config, props.fonts ?? []);

  return config;
};

export default createRunOncePlugin(withFonts, pkg.name, pkg.version);
