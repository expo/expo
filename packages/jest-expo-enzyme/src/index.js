'use strict';
const chalk = require('chalk');

module.exports = function withEnzyme(preset = {}) {
  const { snapshotSerializers = [], haste = {}, setupFilesAfterEnv = [], setupFiles = [] } = preset;

  if (!haste || typeof haste.defaultPlatform !== 'string') {
    const message = chalk.red(
      chalk.bold(`\njest-expo-enzyme: `) +
        `The provided config must have a valid ${chalk.underline(
          '`haste.defaultPlatform: string`'
        )} value defined\n`
    );
    console.log(message);
    throw new Error(message);
  }

  const isNative = ['ios', 'android'].includes(haste.defaultPlatform);

  const commonConfig = {
    ...preset,
    snapshotSerializers: [...snapshotSerializers, 'enzyme-to-json/serializer'],
    timers: 'fake',
  };

  if (isNative) {
    return {
      ...commonConfig,
      setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.native.js`)],
      testEnvironmentOptions: {
        enzymeAdapter: 'react16',
      },
      testEnvironment: 'enzyme',
    };
  }

  return {
    ...commonConfig,
    setupFiles: [...setupFiles, 'jest-canvas-mock'],
    setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.web.js`)],
    testEnvironment: 'jsdom',
  };
};
