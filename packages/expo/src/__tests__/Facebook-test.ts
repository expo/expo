import { NativeModules } from 'react-native';
import * as Facebook from '../Facebook';

import { describeCrossPlatform, mockProperty, unmockAllProperties } from '../../test/mocking';

const fakeReturnValue = { type: 'dismissed' };

function applyMocks() {
  mockProperty(
    NativeModules.ExponentWebBrowser,
    'openBrowserAsync',
    jest.fn(async () => fakeReturnValue)
  );
  mockProperty(console, 'warn', jest.fn(() => {}));
}

describeCrossPlatform('iOS and Android', () => {
  beforeEach(() => {
    applyMocks();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  it('calls with correct parameters', () => {
    Facebook.logInWithReadPermissionsAsync('appId', {
      permissions: ['email'],
    });
    expect(NativeModules.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      'appId',
      { permissions: ['email'] }
    );
  });

  it('converts to appId string when called with a number parameter', () => {
    Facebook.logInWithReadPermissionsAsync(1234 as any, {
      permissions: ['email'],
    });
    expect(NativeModules.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      '1234',
      { permissions: ['email'] }
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as jest.Mock).mock.calls[0][0]).toMatchSnapshot('warning');
  });
});
