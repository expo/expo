'use strict';

module.exports = function withEnzyme(preset = {}) {
  const { snapshotSerializers = [], haste = {}, setupFilesAfterEnv = [], setupFiles = [] } = preset;

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
    snapshotSerializers: [...snapshotSerializers, 'enzyme-to-json/serializer'],
    testEnvironment: 'jsdom',
  };
};
