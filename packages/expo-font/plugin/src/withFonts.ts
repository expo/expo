import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withXmlFontsAndroid, withFontsAndroid, type XmlFonts } from './withFontsAndroid';
import { withFontsIos } from './withFontsIos';

const pkg = require('expo-font/package.json');

export type FontProps = {
  fonts?: string[];
  android?: {
    fonts?: (string | XmlFonts)[];
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

  const xmlFonts = props.android?.fonts?.filter((item) => typeof item !== 'string') ?? [];
  const assetFonts = [
    ...(props.fonts ?? []),
    ...(props.android?.fonts?.filter((item) => typeof item === 'string') ?? []),
  ];

  if (xmlFonts.length > 0) {
    config = withXmlFontsAndroid(config, xmlFonts as XmlFonts[]);
  }

  if (assetFonts.length > 0) {
    config = withFontsAndroid(config, assetFonts as string[]);
  }

  return config;
};

export default createRunOncePlugin(withFonts, pkg.name, pkg.version);
