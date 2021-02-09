// clientIds must be  defined this way (digitdigit-digitdigit)
// or else Google.isValidGUID will fail
const CONFIG = {
  iosClientId: `IOS_CLIENT_ID.11-11`,
  iosStandaloneAppClientId: `IOS_STANDALONE_ID.33-33`,
};

const RESULTING_CLIENT_IDS = {
  iosClientId: `11-11.apps.googleusercontent.com`,
  iosStandaloneAppClientId: `33-33.apps.googleusercontent.com`,
};

function mockConstants(constants: { [key: string]: any } = {}): void {
  jest.doMock('expo-constants', () => {
    const Constants = jest.requireActual('expo-constants').default;
    return {
      ...Constants,
      ...constants,
    };
  });
}

describe('iOS, managed workflow', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it(`client id used in Expo Client development app`, () => {
    mockConstants({
      appOwnership: 'expo',
    });

    const AppAuth = require('expo-app-auth');
    jest.spyOn(AppAuth, 'authAsync');
    const { logInAsync } = require('../Google');

    logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: RESULTING_CLIENT_IDS.iosClientId })
    );
  });
  it(`standalone id used in standalone app`, () => {
    mockConstants({
      appOwnership: 'standalone',
    });
    const AppAuth = require('expo-app-auth');
    jest.spyOn(AppAuth, 'authAsync');
    const { logInAsync } = require('../Google');

    logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: RESULTING_CLIENT_IDS.iosStandaloneAppClientId })
    );
  });
});

describe('Android, bare workflow', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it(`standalone id used in bare app`, () => {
    const AppAuth = require('expo-app-auth');
    jest.spyOn(AppAuth, 'authAsync');
    const { logInAsync } = require('../Google');

    logInAsync(CONFIG);
    expect(AppAuth.authAsync).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: RESULTING_CLIENT_IDS.iosStandaloneAppClientId })
    );
  });
});
