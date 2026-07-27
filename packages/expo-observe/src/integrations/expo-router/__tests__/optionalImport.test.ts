// `expo-router` is an optional peer dependency. The integration must reach it ONLY
// through the `router` wrapper (a try/catch require), never via a direct
// `import { x } from 'expo-router'`
jest.mock('expo-router', () => {
  throw new Error('simulated: expo-router is not installed');
});

jest.mock('../router', () => ({
  __esModule: true,
  isRouterInstalled: true,
  optionalRouter: {
    useRoute: jest.fn(),
    useNavigation: jest.fn(),
    useCurrentRouteInfo: jest.fn(),
    unstable_navigationEvents: {
      enable: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  },
}));

describe('expo-router integration optional imports', () => {
  it('loads its entry point without expo-router installed', () => {
    expect(() => require('../index')).not.toThrow();
  });
});
