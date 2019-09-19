import { NativeModulesProxy } from '@unimodules/core';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExponentFacebook from '../ExponentFacebook';
import * as Facebook from '../Facebook';

const fakeReturnValue = { type: 'dismissed' };

function applyMocks() {
  mockProperty(
    NativeModulesProxy.ExpoWebBrowser,
    'openBrowserAsync',
    jest.fn(async () => fakeReturnValue)
  );
  mockProperty(console, 'warn', jest.fn(() => {}));
}

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

it(`calls with correct parameters`, () => {
  Facebook.logInWithReadPermissionsAsync('appId', {
    permissions: ['email'],
  });
  expect(ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith('appId', {
    permissions: ['email'],
  });
});

it(`converts to appId string when called with a number parameter`, () => {
  Facebook.logInWithReadPermissionsAsync(1234 as any, {
    permissions: ['email'],
  });
  expect(ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith('1234', {
    permissions: ['email'],
  });
  expect(console.warn).toHaveBeenCalledTimes(1);
  expect((console.warn as jest.Mock).mock.calls[0][0]).toMatchSnapshot('warning');
});
