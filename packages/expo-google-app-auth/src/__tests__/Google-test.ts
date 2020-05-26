import * as Google from '../Google';
import * as AppAuth from 'expo-app-auth';

jest.spyOn(AppAuth, 'authAsync');

const CONFIG = {
  iosClientId: `IOS_CLIENT_ID.12-12`,
  androidClientId: `ANDROID_CLIENT_ID.34-34`,
  iosStandaloneAppClientId: `IOS_STANDALONE_ID.56-56`,
  androidStandaloneAppClientId: `ANDROID_STANDALONE_ID.78-78`,
};

function mockConstants(constants: { [key: string]: any } = {}): void {
  jest.doMock('expo-constants', () => {
    const Constants = jest.requireActual('expo-constants').default;
    return {
      ...Constants,
      ...constants,
      manifest: { ...Constants.manifest, ...(constants.manifest || {}) },
    };
  });
}

function eraseConstants(): void {
  jest.doMock('expo-constants', () => {
    return {
      manifest: null,
    };
  });
}

describe('Bare', () => {
  afterEach(() => {
    jest.resetModules();
  });
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => (console.warn = originalWarn));

  it(`getPlatformGUID in bare app`, () => {
    eraseConstants();
    Google.logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: '56-56.apps.googleusercontent.com' })
    );
  });
});

describe('Managed', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it(`getPlatformGUID in standalone app`, () => {
    mockConstants({
      linkingUri: 'exp://exp.host/@test/test',
      manifest: {
        scheme: 'demo',
      },
      appOwnership: 'standalone',
    });
    Google.logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: '56-56.apps.googleusercontent.com' })
    );
  });

  it(`getPlatformGUID in Expo Client development app`, () => {
    mockConstants({
      linkingUri: 'exp://exp.host/@test/test',
      manifest: {
        scheme: 'demo',
      },
      appOwnership: 'expo',
    });
    Google.logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: '12-12.apps.googleusercontent.com' })
    );
  });
});
