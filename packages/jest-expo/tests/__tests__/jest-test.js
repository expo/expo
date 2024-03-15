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

  it(`injects process.env.EXPO_OS via babel-preset-expo automatically`, () => {
    const { OS } = require('../default-extension');
    const { Platform } = require('expo-modules-core');
    expect(Platform.OS).toEqual(process.env.EXPO_OS);
    expect(OS).toContain(process.env.EXPO_OS);
  });
});
