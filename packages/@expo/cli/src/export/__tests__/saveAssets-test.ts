import { persistMetroFilesAsync } from '../saveAssets';

jest.mock('fs');

// jest.mock('../../log');

jest.mock('../persistMetroAssets', () => ({
  copyInBatchesAsync: jest.fn(),
}));

describe(persistMetroFilesAsync, () => {
  it(`logs file output`, async () => {
    const fixture = {
      '_expo/static/js/ios/entry-291a6044d9323dd48269feb7409e3ce4.hbc': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/js/ios/entry-291a6044d9323dd48269feb7409e3ce4.js.map': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/js/android/entry-14906d0a40e4a257e71f03f84c1d52fa.hbc': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/js/android/entry-14906d0a40e4a257e71f03f84c1d52fa.js.map': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      'assets/b6c297a501e289394b0bc5dc69c265e6': {
        originFilename: '../../packages/expo-router/assets/file.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/file.png',
      },
      'assets/5974eb3e1c5314e8d5a822702d7d0740': {
        originFilename: '../../packages/expo-router/assets/pkg.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/pkg.png',
      },
      'assets/9d9c5644f55c2f6e4b7f247c378b2fe9': {
        originFilename: '../../packages/expo-router/assets/forward.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/forward.png',
      },
      'assets/7d40544b395c5949f4646f5e150fe020': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/cdd04e13d4ec83ff0cd13ec8dabdc341': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1.5x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/a132ecc4ba5c1517ff83c0fb321bc7fc': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@2x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/0ea69b5077e7c4696db85dbcba75b0e1': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@3x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/f5b790e2ac193b3d41015edb3551f9b8': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@4x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/5223c8d9b0d08b82a5670fb5f71faf78': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon-mask.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon-mask.png',
      },
      'assets/563d5e3294b67811d0a1aede6f601e30': {
        originFilename: '../../packages/expo-router/assets/error.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/error.png',
      },
      'assets/778ffc9fe8773a878e9c30a6304784de': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/376d6a4c7f622917c39feb23671ef71d': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1.5x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/c79c3606a1cf168006ad3979763c7e0c': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@2x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/02bc1fa7c0313217bde2d65ccbff40c9': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@3x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/35ba0eaec5a4f5ed12ca16fabeae451d': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@4x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'debug.html': { contents: '' },
      'metadata.json': { contents: '' },
      'index.html': { contents: '', routeId: '' },
      'other-2.html': { contents: '', routeId: 'other-2' },
      'other.html': { contents: '', routeId: 'other' },
      '_sitemap.html': { contents: '', routeId: '_sitemap' },
      '+not-found.html': { contents: '', routeId: '+not-found' },
      '_expo/static/js/web/entry-ff798bea581081aa6ae19bf03319ac8c.js': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/js/web/entry-ff798bea581081aa6ae19bf03319ac8c.js.map': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/css/global-3cacee391842ae4718002b75462bf182.css': {
        contents: '',
        originFilename: 'global.css',
      },
      '_expo/routes.json': { contents: '' },
    };
    await persistMetroFilesAsync(new Map(Object.entries(fixture)), '/');
  });
  xit(`logs file output`, async () => {
    const fixture = {
      '_expo/static/js/ios/entry-ead4b1e145f9bc2a1ad746d8faad573d.hbc': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/js/android/entry-7370d9105a38a79bb53f56eaa49890af.hbc': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      'assets/b6c297a501e289394b0bc5dc69c265e6': {
        originFilename: '../../packages/expo-router/assets/file.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/file.png',
      },
      'assets/5974eb3e1c5314e8d5a822702d7d0740': {
        originFilename: '../../packages/expo-router/assets/pkg.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/pkg.png',
      },
      'assets/9d9c5644f55c2f6e4b7f247c378b2fe9': {
        originFilename: '../../packages/expo-router/assets/forward.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/forward.png',
      },
      'assets/7d40544b395c5949f4646f5e150fe020': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/cdd04e13d4ec83ff0cd13ec8dabdc341': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1.5x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/a132ecc4ba5c1517ff83c0fb321bc7fc': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@2x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/0ea69b5077e7c4696db85dbcba75b0e1': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@3x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/f5b790e2ac193b3d41015edb3551f9b8': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@4x.ios.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/5223c8d9b0d08b82a5670fb5f71faf78': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon-mask.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon-mask.png',
      },
      'assets/563d5e3294b67811d0a1aede6f601e30': {
        originFilename: '../../packages/expo-router/assets/error.png',
        contents: '',
        assetId: '../../packages/expo-router/assets/error.png',
      },
      'assets/778ffc9fe8773a878e9c30a6304784de': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/376d6a4c7f622917c39feb23671ef71d': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@1.5x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/c79c3606a1cf168006ad3979763c7e0c': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@2x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/02bc1fa7c0313217bde2d65ccbff40c9': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@3x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'assets/35ba0eaec5a4f5ed12ca16fabeae451d': {
        originFilename:
          '../../node_modules/@react-navigation/elements/src/assets/back-icon@4x.android.png',
        contents: '',
        assetId: '../../node_modules/@react-navigation/elements/src/assets/back-icon.png',
      },
      'metadata.json': { contents: '' },
      'index.html': { contents: '' },
      'other-2.html': { contents: '' },
      'other.html': { contents: '' },
      '_sitemap.html': { contents: '' },
      '+not-found.html': { contents: '' },
      '_expo/static/js/web/entry-8cb99d4ba6a73ba957559bd355166bde.js': {
        contents: '',
        originFilename: '../../packages/expo-router/entry.js',
      },
      '_expo/static/css/global-3cacee391842ae4718002b75462bf182.css': {
        contents: '',
        originFilename: 'global.css',
      },
      '_expo/routes.json': { contents: '' },
    };

    await persistMetroFilesAsync(new Map(Object.entries(fixture)), '/');
  });
});
