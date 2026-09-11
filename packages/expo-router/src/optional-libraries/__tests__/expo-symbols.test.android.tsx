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
        "The 'expo-symbols' package needs to be installed in order to use this feature."
      );
      expect(() => requireExpoSymbols('Custom error message')).toThrow('Custom error message');
    });
  });
});
