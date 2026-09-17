describe('requireExpoUISwiftUI', () => {
  afterEach(() => {
    jest.dontMock('@expo/ui/swift-ui');
  });

  it('returns the installed library', () => {
    jest.isolateModules(() => {
      const { requireExpoUISwiftUI } = require('../expo-ui-swift-ui');

      expect(requireExpoUISwiftUI()).toEqual({
        expoUI: require('@expo/ui/swift-ui'),
        modifiers: require('@expo/ui/swift-ui/modifiers'),
      });
    });
  });

  it('throws when the library is not installed', () => {
    jest.doMock('@expo/ui/swift-ui', () => {
      throw new Error("Cannot find module '@expo/ui/swift-ui'");
    });

    jest.isolateModules(() => {
      const { requireExpoUISwiftUI } = require('../expo-ui-swift-ui');

      expect(requireExpoUISwiftUI).toThrow(
        "The '@expo/ui' package needs to be installed in order to use this feature."
      );
      expect(() => requireExpoUISwiftUI('Custom error message')).toThrow('Custom error message');
    });
  });
});
