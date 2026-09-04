describe('requireExpoUI', () => {
  afterEach(() => {
    jest.dontMock('@expo/ui/jetpack-compose');
  });

  it('returns the installed library', () => {
    jest.isolateModules(() => {
      const { requireExpoUI } = require('../expo-ui');

      expect(requireExpoUI()).toEqual({
        expoUI: require('@expo/ui/jetpack-compose'),
        modifiers: require('@expo/ui/jetpack-compose/modifiers'),
      });
    });
  });

  it('throws when the library is not installed', () => {
    jest.doMock('@expo/ui/jetpack-compose', () => {
      throw new Error("Cannot find module '@expo/ui/jetpack-compose'");
    });

    jest.isolateModules(() => {
      const { requireExpoUI } = require('../expo-ui');

      expect(requireExpoUI).toThrow(
        "Stack.Toolbar on Android requires '@expo/ui'. Install it with `npx expo install @expo/ui` and rebuild your app."
      );
    });
  });
});
