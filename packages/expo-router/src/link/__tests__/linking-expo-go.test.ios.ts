const originalExpo = (globalThis as any).expo;

// `linking.ts` reads the Expo Go module at import time, so the global must be
// prepared before requiring the module under test.
(globalThis as any).expo = {
  ...originalExpo,
  modules: {
    ...originalExpo?.modules,
    ExpoGo: {},
  },
};

let mockLinkingListener: ((event: { url: string }) => void) | undefined;

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `exp://127.0.0.1:8081${path}`),
  getLinkingURL: jest.fn(),
  addEventListener: jest.fn(
    (_event: string, listener: (event: { url: string }) => void) => {
      mockLinkingListener = listener;
      return { remove: jest.fn() };
    }
  ),
}));

const Linking = require('expo-linking') as typeof import('expo-linking');
const { getInitialURL, getRootURL } =
  require('../linking') as typeof import('../linking');

const mockedLinking = Linking as jest.Mocked<typeof Linking>;

beforeEach(() => {
  mockLinkingListener = undefined;
  mockedLinking.getLinkingURL.mockReset();
  mockedLinking.addEventListener.mockClear();
});

afterAll(() => {
  (globalThis as any).expo = originalExpo;
});

it('uses the Expo Go root URL when the launch URL has no route path', () => {
  mockedLinking.getLinkingURL.mockReturnValue('exp://127.0.0.1:8081/');

  expect(getInitialURL()).toBe(getRootURL());
});

it('keeps Expo Go URLs that already include a route path', () => {
  mockedLinking.getLinkingURL.mockReturnValue(
    'exp://127.0.0.1:8081/--/profile/evan'
  );

  expect(getInitialURL()).toBe('exp://127.0.0.1:8081/--/profile/evan');
});
