import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { withFontsAndroid } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('expo-font/package.json');

export type FontProps = {
  fonts?: string[];
};

const withFonts: ConfigPlugin<FontProps> = (config, props) => {
  const fonts =
    props.fonts
      ?.map((p) => {
        const resolvedPath = path.resolve(config._internal?.projectRoot, p);
        if (fs.statSync(resolvedPath).isDirectory()) {
          return fs.readdirSync(resolvedPath).map((file) => path.join(resolvedPath, file));
        }
        return [resolvedPath];
      })
      .flat() ?? [];

  if (fonts.length === 0) {
    return config;
  }

  config = withFontsIos(config, fonts);
  config = withFontsAndroid(config, fonts);

  return config;
};

export default createRunOncePlugin(withFonts, pkg.name, pkg.version);
