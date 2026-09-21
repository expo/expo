const expoPreset = require('../../jest-preset');
const {
  getWebPreset,
  getNodePreset,
  getIOSPreset,
  getAndroidPreset,
} = require('../../config/getPlatformPreset');

describe.each([
  ['web', getWebPreset],
  ['node', getNodePreset],
  ['ios', getIOSPreset],
  ['android', getAndroidPreset],
])('%s preset', (_name, getPreset) => {
  it('keeps the module name mappers from the base preset', () => {
    const { moduleNameMapper } = getPreset();
    for (const pattern of Object.keys(expoPreset.moduleNameMapper)) {
      expect(moduleNameMapper).toHaveProperty([pattern], expoPreset.moduleNameMapper[pattern]);
    }
  });

  it('keeps the module name mappers from the platform preset', () => {
    const { moduleNameMapper } = getPreset();
    expect(moduleNameMapper).toHaveProperty(['^(\\.{1,2}/.*)\\.js$'], '$1');
  });
});
