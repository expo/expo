describe(`jest-expo/universal`, () => {
  it(`resolves to default extensions`, () => {
    const { OS } = require('../default-extension');
    const { Platform } = require('expo-modules-core');
    expect(OS).toContain(Platform.OS);
    expect(OS).toMatchSnapshot();
  });
  it(`resolves to fallback extensions`, () => {
    const { OS } = require('../fallback-extension');
    const { Platform } = require('expo-modules-core');
    expect(OS).toContain(Platform.OS);
    expect(OS).toMatchSnapshot();
  });
});
