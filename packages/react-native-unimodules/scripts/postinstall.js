#!/usr/bin/env node

const chalk = require('chalk');
const packageJson = require('../package.json');

// Don't run the script when doing `yarn` or `npm install` in this package.
if (process.env.PWD === process.env.INIT_CWD) {
  process.exit(0);
  return;
}

console.info(chalk.green(`
Successfully installed ${chalk.red(packageJson.name)}. This package contains core unimodules that are commonly depended on by other unimodules. You will need to configure your project before using other unimodules like ${chalk.red('expo-camera')}, ${chalk.red('expo-media-library')} and others.
See configuration guide:
  ${chalk.blue(`https://www.npmjs.com/package/${packageJson.name}/v/${packageJson.version}`)}
`));
