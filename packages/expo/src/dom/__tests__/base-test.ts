jest.mock('react-native/Libraries/Core/Devtools/getDevServer', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ url: 'http://localhost:8081' }),
}));

describe('getBaseURL', () => {
  let getBaseURL: typeof import('../base').getBaseURL;

  const originalProcessEnv = process.env;
  const originalExpo = globalThis.expo;
  beforeEach(() => {
    // Reset the module to clear the `getBaseURL` underlying cache
    jest.resetModules();
    getBaseURL = require('../base').getBaseURL;
  });

  afterEach(() => {
    globalThis.expo = originalExpo;
    process.env = originalProcessEnv;
  });

  it('should serve from updates directory when using updates', () => {
    // @ts-expect-error: mock partial properties
    globalThis.expo = {
      modules: {
        ExpoUpdates: {
          isEnabled: true,
          isEmbeddedLaunch: false,
          localAssets: {
            '5d41402abc4b2a76b9719d911017c592':
              'file:///path/to/.expo-internal/5d41402abc4b2a76b9719d911017c592.png',
          },
        },
      },
    };

    expect(getBaseURL()).toBe('file:///path/to/.expo-internal');
  });

  it('should serve from app builtin directory when using updates with embedded bundle', () => {
    // @ts-expect-error: mock partial properties
    globalThis.expo = {
      modules: {
        ExpoUpdates: {
          isEnabled: true,
          isEmbeddedLaunch: true,
          localAssets: {
            '5d41402abc4b2a76b9719d911017c592':
              'file:///path/to/.expo-internal/5d41402abc4b2a76b9719d911017c592.png',
          },
        },
      },
    };
    process.env.NODE_ENV = 'production';
    switch (process.env.EXPO_OS) {
      case 'android': {
        expect(getBaseURL()).toBe('file:///android_asset/www.bundle');
        break;
      }
      case 'ios': {
        expect(getBaseURL()).toBe('www.bundle');
        break;
      }
      default: {
        expect(getBaseURL()).toBe('');
        break;
      }
    }
  });

  it('should serve from app builtin directory for production builds', () => {
    process.env.NODE_ENV = 'production';
    switch (process.env.EXPO_OS) {
      case 'android': {
        expect(getBaseURL()).toBe('file:///android_asset/www.bundle');
        break;
      }
      case 'ios': {
        expect(getBaseURL()).toBe('www.bundle');
        break;
      }
      default: {
        expect(getBaseURL()).toBe('');
        break;
      }
    }
  });

  it('should serve from dev server for development builds', () => {
    process.env.NODE_ENV = 'development';
    switch (process.env.EXPO_OS) {
      case 'android':
      case 'ios': {
        expect(getBaseURL()).toBe('http://localhost:8081/_expo/@dom');
        break;
      }
      default: {
        expect(getBaseURL()).toBe('');
        break;
      }
    }
  });
});
