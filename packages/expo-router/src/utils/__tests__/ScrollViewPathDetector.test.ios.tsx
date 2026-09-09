import { fireEvent, render, screen } from '@testing-library/react-native';

const mockRequireOptionalNativeModule = jest.fn((_name: string): object | null => ({}));
const mockDisableScrollViewDetection = jest.fn((): boolean | undefined => undefined);

jest.mock('expo', () => {
  const actual = jest.requireActual('expo');
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    ...actual,
    requireOptionalNativeModule: (name: string) => mockRequireOptionalNativeModule(name),
    requireNativeView: () => (props: object) =>
      React.createElement(View, { testID: 'RouterScrollViewDetectorView', ...props }),
  };
});

jest.mock('expo-constants', () => {
  const original = jest.requireActual('expo-constants');
  return {
    ...original,
    expoConfig: {
      extra: {
        router: {
          get disableScrollViewDetection() {
            return mockDisableScrollViewDetection();
          },
        },
      },
    },
  };
});

const originalEnv = process.env.NODE_ENV;
let warnSpy: jest.SpyInstance;

// The native view is resolved when the module loads, so load it per test with the wanted env.
function loadDetector(nodeEnv: typeof process.env.NODE_ENV = 'development') {
  process.env.NODE_ENV = nodeEnv;
  let ScrollViewPathDetector: typeof import('../ScrollViewPathDetector').ScrollViewPathDetector;
  jest.isolateModules(() => {
    ({ ScrollViewPathDetector } = require('../ScrollViewPathDetector'));
  });
  return ScrollViewPathDetector!;
}

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  warnSpy.mockRestore();
});

function fireDetected(
  classification: string,
  paths: { firstChildPath?: string[]; scrollViewPath?: string[] } = {}
) {
  fireEvent(screen.getByTestId('RouterScrollViewDetectorView'), 'scrollViewDetected', {
    nativeEvent: { classification, firstChildPath: [], scrollViewPath: [], ...paths },
  });
}

describe('ScrollViewPathDetector', () => {
  it('renders the native detector in development', () => {
    const ScrollViewPathDetector = loadDetector();
    render(<ScrollViewPathDetector routeName="index" />);
    expect(screen.getByTestId('RouterScrollViewDetectorView')).toBeTruthy();
  });

  it('renders nothing outside development', () => {
    const ScrollViewPathDetector = loadDetector('production');
    const { toJSON } = render(<ScrollViewPathDetector routeName="index" />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when disabled in the app config', () => {
    const ScrollViewPathDetector = loadDetector();
    mockDisableScrollViewDetection.mockReturnValueOnce(true);
    const { toJSON } = render(<ScrollViewPathDetector routeName="index" />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when the native module is missing', () => {
    mockRequireOptionalNativeModule.mockReturnValueOnce(null);
    const ScrollViewPathDetector = loadDetector();
    const { toJSON } = render(<ScrollViewPathDetector routeName="index" />);
    expect(toJSON()).toBeNull();
  });

  it('warns once per route when the scroll view is off the first child path', () => {
    const ScrollViewPathDetector = loadDetector();
    render(<ScrollViewPathDetector routeName="feed" />);
    const paths = {
      firstChildPath: ['RCTViewComponentView', 'RCTParagraphComponentView'],
      scrollViewPath: [
        'RCTViewComponentView',
        'RCTScrollViewComponentView',
        'RCTEnhancedScrollView',
      ],
    };
    fireDetected('off-path', paths);
    fireDetected('off-path', paths);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain('Screen "feed"');
    expect(message).toContain('View > Text');
    expect(message).toContain('View > ScrollView');
    expect(message).toContain('extra.router.disableScrollViewDetection');
  });

  it('warns separately for different routes', () => {
    const ScrollViewPathDetector = loadDetector();
    render(
      <>
        <ScrollViewPathDetector routeName="one" />
        <ScrollViewPathDetector routeName="two" />
      </>
    );
    const detectors = screen.getAllByTestId('RouterScrollViewDetectorView');
    const event = {
      nativeEvent: {
        classification: 'off-path',
        firstChildPath: ['ReactViewGroup', 'ReactTextView'],
        scrollViewPath: ['ReactViewGroup', 'ReactScrollView'],
      },
    };
    fireEvent(detectors[0]!, 'scrollViewDetected', event);
    fireEvent(detectors[1]!, 'scrollViewDetected', event);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0][0]).toContain('Screen "one"');
    expect(warnSpy.mock.calls[1][0]).toContain('Screen "two"');
  });

  it.each(['first-child', 'nested-navigator', 'none', 'ambiguous', 'embedded'])(
    'does not warn for the %s classification',
    (classification) => {
      const ScrollViewPathDetector = loadDetector();
      render(<ScrollViewPathDetector routeName={`quiet-${classification}`} />);
      fireDetected(classification);
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );
});
