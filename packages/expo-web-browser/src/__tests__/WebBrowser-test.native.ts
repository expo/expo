import { unmockAllProperties } from 'jest-expo';

import ExpoWebBrowser from '../ExpoWebBrowser';
import * as WebBrowser from '../WebBrowser';

const fakeReturnValue = {
  type: 'cancel',
};

function applyMocks() {
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
