jest.mock('expo-router', () => {
  throw new Error('simulated: expo-router is not installed');
});
jest.mock('@react-navigation/native', () => {
  throw new Error('simulated: @react-navigation/native is not installed');
});

jest.mock('../integrations/expo-router/router', () => ({
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
jest.mock('../integrations/react-navigation/reactNavigation', () => ({
  __esModule: true,
  isReactNavigationInstalled: true,
  optionalReactNavigation: {
    NavigationContainer: () => null,
    useNavigationContainerRef: jest.fn(),
    useRoute: jest.fn(),
    useNavigation: jest.fn(),
    useStateForPath: jest.fn(),
  },
}));

// The native module and app-metrics are unrelated to this guard; stub them so requiring
// the root entry doesn't reach native code at load time. `NativeModule`/`registerWebModule`
// are needed for the web build (`module.web.ts`), which extends `NativeModule`.
jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({
    configure: jest.fn(),
    setBundleDefaults: jest.fn(),
    dispatchEvents: jest.fn(() => Promise.resolve()),
  })),
  NativeModule: class {},
  registerWebModule: jest.fn((ModuleClass) => new ModuleClass()),
}));
jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSession: jest.fn(() => ({ id: 'session-1' })),
  },
}));

describe('expo-observe root entry optional imports', () => {
  it('loads with neither expo-router nor @react-navigation/native installed', () => {
    expect(() => require('../index')).not.toThrow();
  });
});
