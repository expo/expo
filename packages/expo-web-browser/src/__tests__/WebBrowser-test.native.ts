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
