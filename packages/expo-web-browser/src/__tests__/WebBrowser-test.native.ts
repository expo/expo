import { unmockAllProperties, mockLinking } from 'jest-expo';

import ExpoWebBrowser from '../ExpoWebBrowser';
import * as WebBrowser from '../WebBrowser';

const fakeReturnValue = {
  type: 'cancel',
};

function applyMocks() {
  mockLinking();
  ExpoWebBrowser.openBrowserAsync.mockImplementation(async () => fakeReturnValue);
  ExpoWebBrowser.dismissBrowser.mockImplementation(async () =>
    Promise.resolve({ type: 'dismiss' })
  );
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

it(`dismissBrowser returns promise`, async () => {
  const closeResult = await WebBrowser.dismissBrowser();
  expect(closeResult).toEqual({ type: 'dismiss' });
  expect(ExpoWebBrowser.dismissBrowser).toHaveBeenCalledTimes(1);
});
