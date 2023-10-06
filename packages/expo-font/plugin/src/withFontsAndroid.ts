import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

export const withFontsAndroid: ConfigPlugin<string[]> = (config, fonts) => {
  return withDangerousMod(config, [
    'android',
    (config) => {
      (fonts || []).forEach((asset) => {
        const fontsDir = path.join(
          config.modRequest.platformProjectRoot,
          'app/src/main/assets/fonts'
        );
        fs.mkdirSync(fontsDir, { recursive: true });
        const output = path.join(fontsDir, path.basename(asset));
        fs.copyFileSync(asset, output);
      });
      return config;
    },
  ]);
};
