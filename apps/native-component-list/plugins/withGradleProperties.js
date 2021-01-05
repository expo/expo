const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');

// Use this improve gradle builds
module.exports = (config, options) => {
  assert(options, 'gradle.properties must be defined')
  return withDangerousMod(config, [
    'android',
    async config => {
      const filePath = path.join(config.modRequest.projectRoot, 'ios', 'gradle.properties');
      let contents = await fs.readFile(filePath, 'utf-8');
      let lines = contents.split('\n').map(v => v.split());
      for (const line of lines) { 
          if (!line.startsWith('#')) {
              const eok = line.indexOf('=');
            const keyName = line.split(0, eok);
            console.log(keyName);
          }
      }
    //   contents = contents.replace(/platform :ios, '(.*)'/, `platform :ios, '${version}'`);
      await fs.writeFile(filePath, contents);

      return config;
    },
  ]);
};

