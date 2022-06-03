import { unmockAllProperties } from 'jest-expo';
import { Linking, EmitterSubscription } from 'react-native';

import ExpoWebBrowser from '../ExpoWebBrowser';
import * as WebBrowser from '../WebBrowser';

const fakeReturnValue = {
  type: 'cancel',
};

// we need a mock subscription, because original Linking.addEventListener returns undefined in tests
class MockSubscription implements Pick<EmitterSubscription, 'remove'> {
  private _isCancelled = false;

  remove = jest.fn().mockImplementation(() => {
    if (this._isCancelled) {
      throw new Error(
        'MockSubscription: Cannot remove a subscription that has already been cancelled'
      );
    }
    this._isCancelled = true;
  });
}

function applyMocks() {
  Linking.addEventListener = jest.fn().mockImplementation(() => new MockSubscription());
  ExpoWebBrowser.openBrowserAsync.mockImplementation(async () => fakeReturnValue);
}

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

it(`openBrowserAsync returns correctly`, async () => {
  const pageUrl = 'http://expo.io';
  const openResult = await WebBrowser.openBrowserAsync(pageUrl);
  expect(openResult).toEqual(fakeReturnValue);
  expect(ExpoWebBrowser.openBrowserAsync).toHaveBeenCalledWith(pageUrl, {});
});

it(`dismissBrowser returns nothing`, () => {
  const closeResult = WebBrowser.dismissBrowser();
  expect(closeResult).toBeUndefined();
  expect(ExpoWebBrowser.dismissBrowser).toHaveBeenCalledTimes(1);
});

it(`openAuthSessionAsync allows subsequent attempts if the browser never opens`, async () => {
  ExpoWebBrowser.openBrowserAsync.mockRejectedValueOnce(new Error('No matching activity!'));
  ExpoWebBrowser.openBrowserAsync.mockRejectedValueOnce(new Error('Current activity not found!'));
  ExpoWebBrowser.openBrowserAsync.mockRejectedValueOnce(new Error('No package manager!'));
  const pageUrl = 'http://expo.io';
  const redirectUrl = 'exp://expo.io';
  await expect(WebBrowser.openAuthSessionAsync(pageUrl, redirectUrl)).rejects.toThrowError(
    'No matching activity!'
  );
  await expect(WebBrowser.openAuthSessionAsync(pageUrl, redirectUrl)).rejects.toThrowError(
    'Current activity not found!'
  );
  await expect(WebBrowser.openAuthSessionAsync(pageUrl, redirectUrl)).rejects.toThrowError(
    'No package manager!'
  );
});
