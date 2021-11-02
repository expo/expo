const { withDangerousMod } = require('@expo/config-plugins');
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');

// Use this plugin to set the Podfile min version to 11.0 (required for GoogleSignIn).
module.exports = (config, version) => {
  assert(version, 'Podfile version must be defined. ex. "10.0"');
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let contents = await fs.readFile(filePath, 'utf-8');
      contents = contents.replace(/platform :ios, '(.*)'/, `platform :ios, '${version}'`);
      await fs.writeFile(filePath, contents);

      return config;
    },
  ]);
};
