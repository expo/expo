describe('screensCompat', () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock('react-native-screens');
    jest.unmock('react-native-screens/experimental');
  });

  it('uses Stack and Split from the main entry when available', () => {
    const Stack = {};
    const Split = {};
    jest.doMock('react-native-screens', () => ({ Stack, Split }));
    jest.doMock('react-native-screens/experimental', () => {
      throw new Error('The experimental entry should not be loaded');
    });

    jest.isolateModules(() => {
      const compat = require('../screensCompat');
      expect(compat.StackV5).toBe(Stack);
      expect(compat.Split).toBe(Split);
    });
  });

  it('falls back to the experimental entry when the main entry omits Stack and Split', () => {
    const Stack = {};
    const Split = {};
    jest.doMock('react-native-screens', () => ({}));
    jest.doMock('react-native-screens/experimental', () => ({ Stack, Split }));

    jest.isolateModules(() => {
      const compat = require('../screensCompat');
      expect(compat.StackV5).toBe(Stack);
      expect(compat.Split).toBe(Split);
    });
  });
});
