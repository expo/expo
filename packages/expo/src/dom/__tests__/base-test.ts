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
            '8d4e297c3b3e49a614248143d53e40ca':
              'file:///android_res/drawable-mdpi/node_modules_reactnavigation_elements_lib_module_assets_closeicon.png',
            '4403c6117ec30c859bc95d70ce4a71d3':
              'file:///android_res/drawable-mdpi/node_modules_reactnavigation_elements_lib_module_assets_searchicon.png',
            '5d41402abc4b2a76b9719d911017c592':
              'file:///path/to/.expo-internal/5d41402abc4b2a76b9719d911017c592.png',
            '1d1ea1496f9057eb392d5bbf3732a61b7':
              'file:///android_res/drawable/node_modules_exporouter_assets_error.png',
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
            '8d4e297c3b3e49a614248143d53e40ca':
              'file:///android_res/drawable-mdpi/node_modules_reactnavigation_elements_lib_module_assets_closeicon.png',
            '4403c6117ec30c859bc95d70ce4a71d3':
              'file:///android_res/drawable-mdpi/node_modules_reactnavigation_elements_lib_module_assets_searchicon.png',

            '5d41402abc4b2a76b9719d911017c592':
              'file:///path/to/.expo-internal/5d41402abc4b2a76b9719d911017c592.png',
            '1d1ea1496f9057eb392d5bbf3732a61b7':
              'file:///android_res/drawable/node_modules_exporouter_assets_error.png',
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
