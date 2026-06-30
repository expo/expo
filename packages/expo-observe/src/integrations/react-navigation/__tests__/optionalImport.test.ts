// `@react-navigation/native` is an optional peer dependency. The integration must
// reach it ONLY through the `reactNavigation` wrapper (a try/catch require), never
// via a direct `import { x } from '@react-navigation/native'`
jest.mock('@react-navigation/native', () => {
  throw new Error('simulated: @react-navigation/native is not installed');
});

jest.mock('../reactNavigation', () => ({
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

describe('react-navigation integration optional imports', () => {
  it('loads its entry point without @react-navigation/native installed', () => {
    expect(() => require('../index')).not.toThrow();
  });
});
