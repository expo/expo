describe(`jest-expo/universal`, () => {
  it(`resolves to default extensions`, () => {
    const { OS } = require('../default-extension');
    const { Platform } = require('@unimodules/core');
    expect(OS).toContain(Platform.OS);
  });
  it(`resolves to fallback extensions`, () => {
    const { OS } = require('../fallback-extension');
    const { Platform } = require('@unimodules/core');
    expect(OS).toContain(Platform.OS);
  });
});
