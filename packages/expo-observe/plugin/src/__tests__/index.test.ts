import plugin from '../index';

describe('expo-observe/plugin', () => {
  it('returns a plugin entry for the app config', () => {
    expect(plugin({ ios: { crashReporter: true } })).toEqual([
      'expo-observe',
      { ios: { crashReporter: true } },
    ]);
  });

  it('is exported from the package', () => {
    const packageJson = require('../../../package.json');
    expect(packageJson.exports['./plugin']).toBe('./plugin/build/index.js');
  });
});
