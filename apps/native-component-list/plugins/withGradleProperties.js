const { withDangerousMod } = require('@expo/config-plugins');
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');

// Use this improve gradle builds
module.exports = (config, options) => {
  assert(options, 'gradle.properties must be defined');
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const filePath = path.join(config.modRequest.projectRoot, 'android', 'gradle.properties');
      const contents = await fs.readFile(filePath, 'utf-8');
      const results = [];
      const lines = contents.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          const eok = line.indexOf('=');
          const keyName = line.slice(0, eok);
          let value;
          if (keyName in options) {
            value = options[keyName];
            delete options[keyName];
          } else {
            value = line.slice(eok + 1, line.length);
          }
          results.push(`${keyName}=${value}`);
        } else {
          results.push(line);
        }
      }

      // Add the remaining options
      for (const [key, value] of Object.entries(options)) {
        results.push(`${key}=${value}`);
      }
      await fs.writeFile(filePath, results.join('\n'));
      return config;
    },
  ]);
};
