import chalk from 'chalk';
import { Config } from '@jest/types';

export default function withEnzyme(preset: Config.ProjectConfig) {
  const {
    snapshotSerializers = [],
    testEnvironmentOptions = {},
    haste = { defaultPlatform: null },
    setupFilesAfterEnv = [],
    setupFiles = [],
  } = preset;

  if (!haste || typeof haste.defaultPlatform !== 'string') {
    const message = chalk.red(
      chalk.bold(`\njest-expo-enzyme: `) +
        `The provided config must have a valid ${chalk.underline(
          '`haste.defaultPlatform: string`'
        )} value defined\n`
    );
    console.error(message);
    process.exit(1);
    return;
  }

  const isNative = ['ios', 'android'].includes(haste.defaultPlatform);

  const commonConfig = {
    ...preset,
    snapshotSerializers: [...snapshotSerializers, require.resolve('enzyme-to-json/serializer')],
    testEnvironmentOptions: {
      ...testEnvironmentOptions,
      enzymeAdapter: 'react16',
    },
    testEnvironment: 'enzyme',
  };

  if (isNative) {
    return {
      ...commonConfig,
      setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.native.js`)],
    };
  }

  return {
    ...commonConfig,
    setupFiles: [...setupFiles, require.resolve('jest-canvas-mock')],
    setupFilesAfterEnv: [...setupFilesAfterEnv, require.resolve(`./setupEnzyme.web.js`)],
  };
}

export { withEnzyme };
