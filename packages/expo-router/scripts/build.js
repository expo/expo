'use strict';

const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
if (args.length === 0) {
  spawnSync('expo-module', ['build', '-p', 'tsconfig.json'], {
    stdio: 'inherit',
    shell: true,
  });
} else {
  spawnSync('expo-module', ['build', ...args], {
    stdio: 'inherit',
    shell: true,
  });
}
