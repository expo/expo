import plist from '@expo/plist';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const withInfoPlistValues: ConfigPlugin<Record<string, any>> = (config, values) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const infoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName!,
        'Info.plist'
      );
      const content = fs.readFileSync(infoPlistPath, 'utf8');
      const infoPlist = plist.parse(content);
      let changed = false;

      for (const [key, value] of Object.entries(values)) {
        if (infoPlist[key] !== value) {
          infoPlist[key] = value;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(infoPlistPath, plist.build(infoPlist));
      }

      return config;
    },
  ]);

export default withInfoPlistValues;
