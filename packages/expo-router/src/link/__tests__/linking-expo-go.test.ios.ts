const originalExpo = globalThis.expo;

// `linking.ts` reads the Expo Go module at import time, so the global must be
// prepared before requiring the module under test.
globalThis.expo = {
  ...originalExpo,
  modules: {
    ...originalExpo?.modules,
    ExpoGo: {},
  },
  // Only `modules.ExpoGo` is read by this test.
} as typeof expo;

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'exp://127.0.0.1:8081/--/'),
  getLinkingURL: jest.fn(),
}));

const Linking = require('expo-linking') as typeof import('expo-linking');
const { getInitialURL } = require('../linking') as typeof import('../linking');

const mockedLinking = Linking as jest.Mocked<typeof Linking>;

beforeEach(() => {
  mockedLinking.getLinkingURL.mockReset();
});

afterAll(() => {
  globalThis.expo = originalExpo;
});

it('uses the Expo Go root URL when the launch URL has no route path', () => {
  mockedLinking.getLinkingURL.mockReturnValue('exp://127.0.0.1:8081/');

  expect(getInitialURL()).toBe('');
});

it('keeps Expo Go URLs that already include a route path', () => {
  mockedLinking.getLinkingURL.mockReturnValue('exp://127.0.0.1:8081/--/profile/evan');

  expect(getInitialURL()).toBe('exp://127.0.0.1:8081/--/profile/evan');
});
