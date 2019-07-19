describe(`jest-expo/universal`, () => {
  it(`[moduleFileExtensions]`, () => {
    const { OS } = require('../foo');
    const { Platform } = require('@unimodules/core');
    console.log('NN', OS, Platform.OS);
    expect(OS).toBe(Platform.OS);
  });
  it(`[moduleFileExtensions].native`, () => {
    const { OS } = require('../bar');
    const { Platform } = require('@unimodules/core');
    console.log('NN', OS, Platform.OS);
    expect(OS).toContain(Platform.OS);
  });
});
