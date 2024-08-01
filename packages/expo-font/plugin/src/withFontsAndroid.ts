import { type ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { resolveFontPaths } from './utils';

export const withFontsAndroid: ConfigPlugin<string[]> = (config, fonts) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resolvedFonts = await resolveFontPaths(fonts, config.modRequest.projectRoot);
      await Promise.all(
        resolvedFonts.map(async (asset) => {
          const fontsDir = path.join(
            config.modRequest.platformProjectRoot,
            'app/src/main/assets/fonts'
          );
          await fs.mkdir(fontsDir, { recursive: true });
          const output = path.join(fontsDir, path.basename(asset));
          if (output.endsWith('.ttf') || output.endsWith('.otf')) {
            await fs.copyFile(asset, output);
          }
        })
      );
      return config;
    },
  ]);
};
