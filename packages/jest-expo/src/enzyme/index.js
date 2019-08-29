'use strict';

module.exports = function withEnzyme(preset = {}) {
  const { snapshotSerializers = [], haste = {}, setupFilesAfterEnv = [], setupFiles = [] } = preset;

  const isNative = ['ios', 'android'].includes(haste.defaultPlatform);

  const setupFilePlatform = isNative ? 'native' : 'web';

  if (isNative) {
    return {
      ...preset,
      setupFilesAfterEnv: [
        ...setupFilesAfterEnv,
        require.resolve(`./setupEnzyme.${setupFilePlatform}.js`),
      ],
      snapshotSerializers: [...snapshotSerializers, 'enzyme-to-json/serializer'],
      testEnvironment: 'enzyme',
      testEnvironmentOptions: {
        enzymeAdapter: 'react16',
      },
      timers: 'fake',
    };
  }

  return {
    ...preset,
    setupFiles: [...setupFiles, 'jest-canvas-mock'],
    setupFilesAfterEnv: [
      ...setupFilesAfterEnv,
      require.resolve(`./setupEnzyme.${setupFilePlatform}.js`),
    ],
    snapshotSerializers: [...snapshotSerializers, 'enzyme-to-json/serializer'],
    testEnvironment: 'jsdom',
    timers: 'fake',
  };
};
