import Constants from 'expo-constants';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import { ManagedSessionUrlProvider } from '../ManagedSessionUrlProvider';

const managedSessionUrlProvider = new ManagedSessionUrlProvider();

function applyMocks() {
  mockProperty(Constants.manifest, 'id', '@example/abc');
}

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

it(`returns the correct start URL from getStartUrl`, () => {
  const authUrl = 'https://signin.com';
  const returnUrl = 'exp://expo.io/@example/abc+';
  const result = managedSessionUrlProvider.getStartUrl(authUrl, returnUrl);
  expect(result).toEqual(
    'https://auth.expo.io/@example/abc/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexpo.io%2F%40example%2Fabc%2B'
  );
});

describe(`getDefaultReturnUrl`, () => {
  it(`checks return url`, () => {
    mockProperty(Constants.manifest, 'hostUri', 'exp.host/@example/abc');

    const result = managedSessionUrlProvider.getDefaultReturnUrl();

    expect(result).toEqual('exp://exp.host/@example/abc/--/expo-auth-session');
  });

  it(`checks url with the release chanel`, () => {
    mockProperty(
      Constants.manifest,
      'hostUri',
      'exp.host/@example/abc?release-chanel=release-chanel'
    );

    const result = managedSessionUrlProvider.getDefaultReturnUrl();

    expect(result).toEqual(
      'exp://exp.host/@example/abc/--/expo-auth-session?release-chanel=release-chanel'
    );
  });
});
