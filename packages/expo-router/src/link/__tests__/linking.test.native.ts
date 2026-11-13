let mockCreateURL: (path: string) => string;

jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  getLinkingURL: () => null,
  createURL: (path: string) => mockCreateURL(path),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  __esModule: true,
  default: {
    getInitialURL: () => Promise.resolve(null),
    addEventListener: () => ({ remove() {} }),
  },
}));

function loadLinking(): typeof import('../linking') {
  let linking: typeof import('../linking') | undefined;
  // `getRootURL` caches its result at module scope, so every test needs a fresh module.
  jest.isolateModules(() => {
    linking = require('../linking');
  });
  return linking!;
}

describe('getInitialURL', () => {
  it('uses the root URL when the app is launched without a URL', async () => {
    mockCreateURL = (path) => 'myapp://' + path;
    const { getInitialURL } = loadLinking();

    await expect(Promise.resolve(getInitialURL())).resolves.toBe('myapp:///');
  });

  it('falls back to the root path when no scheme is configured', async () => {
    mockCreateURL = () => {
      throw new Error(
        'Cannot make a deep link into a standalone app with no custom scheme defined'
      );
    };
    const { getInitialURL } = loadLinking();

    await expect(Promise.resolve(getInitialURL())).resolves.toBe('/');
  });
});
