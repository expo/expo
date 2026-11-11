const Stack = { Host: () => null };
const Split = { Host: () => null };

describe('react-native-screens', () => {
  afterEach(() => {
    jest.dontMock('react-native-screens');
    jest.dontMock('react-native-screens/experimental');
  });

  it('uses Stack and Split from the main entry when it exports them (v5)', () => {
    jest.doMock('react-native-screens', () => ({ Stack, Split }));
    jest.doMock('react-native-screens/experimental', () => ({}));

    jest.isolateModules(() => {
      const shim = require('../react-native-screens');

      expect(shim.StackV5).toBe(Stack);
      expect(shim.Split).toBe(Split);
    });
  });

  it('falls back to the experimental entry (v4)', () => {
    jest.doMock('react-native-screens', () => ({}));
    jest.doMock('react-native-screens/experimental', () => ({ Stack, Split }));

    jest.isolateModules(() => {
      const shim = require('../react-native-screens');

      expect(shim.StackV5).toBe(Stack);
      expect(shim.Split).toBe(Split);
    });
  });
});
