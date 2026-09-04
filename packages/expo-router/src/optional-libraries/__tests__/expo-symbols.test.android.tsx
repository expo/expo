describe('requireExpoSymbols', () => {
  afterEach(() => {
    jest.dontMock('expo-symbols');
  });

  it('returns the installed library', () => {
    jest.isolateModules(() => {
      const { requireExpoSymbols } = require('../expo-symbols');

      expect(requireExpoSymbols()).toBe(require('expo-symbols'));
    });
  });

  it('throws when the library is not installed', () => {
    jest.doMock('expo-symbols', () => {
      throw new Error("Cannot find module 'expo-symbols'");
    });

    jest.isolateModules(() => {
      const { requireExpoSymbols } = require('../expo-symbols');

      expect(requireExpoSymbols).toThrow(
        "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
      );
    });
  });
});
