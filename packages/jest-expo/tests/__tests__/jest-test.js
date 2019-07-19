describe(`jest-expo/universal`, () => {
  it(`[moduleFileExtensions] default`, () => {
    const { OS } = require('../foo');
    const { Platform } = require('@unimodules/core');
    expect(OS).toContain(Platform.OS);
  });
  it(`[moduleFileExtensions] fallback`, () => {
    const { OS } = require('../bar');
    const { Platform } = require('@unimodules/core');
    expect(OS).toContain(Platform.OS);
  });
});
