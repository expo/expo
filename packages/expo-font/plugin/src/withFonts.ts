import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withFontsAndroid } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('../../package.json');

export type FontObject = {
  fontFamily: string;
  fontDefinitions: {
    path: string;
    weight: number;
    style?: 'normal' | 'italic' | undefined;
  }[];
};

export type Font = string | FontObject;

export type FontProps = {
  /**
   * An array of font file paths to link to the native project, relative to the project root.
   */
  fonts?: string[];
  android?: {
    /**
     * An array of font definitions to link on Android. Supports object syntax for xml fonts with custom family name.
     */
    fonts?: Font[];
  };
  ios?: {
    /**
     * An array of font file paths to link on iOS. The font family name is taken from the font file.
     */
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
