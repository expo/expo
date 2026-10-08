const path = require('node:path');

const expoPreset = require('../../jest-preset');
const platformPresets = require('../../config/getPlatformPreset');

describe.each([
  ['web', 'getWebPreset'],
  ['node', 'getNodePreset'],
  ['ios', 'getIOSPreset'],
  ['android', 'getAndroidPreset'],
])('%s preset', (_name, presetName) => {
  const getPreset = platformPresets[presetName];

  it('keeps the module name mappers from the base preset', () => {
    const { moduleNameMapper } = getPreset();
    for (const pattern of Object.keys(expoPreset.moduleNameMapper)) {
      expect(moduleNameMapper).toHaveProperty([pattern], expoPreset.moduleNameMapper[pattern]);
    }
  });

  it('does not enable internal workspace source resolution', () => {
    const { moduleNameMapper, testEnvironmentOptions } = getPreset();
    expect(moduleNameMapper).not.toHaveProperty(['^(\\.{1,2}/.*)\\.js$']);
    expect(testEnvironmentOptions.customExportConditions).not.toContain('expo-source');
  });

  it('keeps the module name mappers from the tsconfig paths', () => {
    const currentDir = process.cwd();
    const tsFixturePath = path.resolve(__dirname, '../__fixtures__/tsconfig');

    try {
      process.chdir(tsFixturePath);
      jest.isolateModules(() => {
        const { [presetName]: getPreset } = require('../../config/getPlatformPreset');
        expect(getPreset().moduleNameMapper).toHaveProperty(['^@/(.*)$'], '<rootDir>/src/./$1');
      });
    } finally {
      process.chdir(currentDir);
    }
  });
});
