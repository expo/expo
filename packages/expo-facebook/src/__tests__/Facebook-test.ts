import { NativeModulesProxy } from '@unimodules/core';
import * as Facebook from '../Facebook';

import { describeCrossPlatform, mockProperty, unmockAllProperties } from 'jest-expo';

const fakeReturnValue = { type: 'dismissed' };

function applyMocks() {
  mockProperty(
    NativeModulesProxy.ExpoWebBrowser,
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
    expect(NativeModulesProxy.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      'appId',
      { permissions: ['email'] }
    );
  });

  it('converts to appId string when called with a number parameter', () => {
    Facebook.logInWithReadPermissionsAsync(1234 as any, {
      permissions: ['email'],
    });
    expect(NativeModulesProxy.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      '1234',
      { permissions: ['email'] }
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect((console.warn as jest.Mock).mock.calls[0][0]).toMatchSnapshot('warning');
  });
});
