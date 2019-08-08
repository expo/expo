import { describeCrossPlatform, mockProperty, unmockAllProperties } from 'jest-expo';
import { NativeModulesProxy } from '@unimodules/core';
import * as WebBrowser from '../WebBrowser';

const fakeReturnValue = {
  type: 'cancel',
};

function applyMocks() {
  mockProperty(
    NativeModulesProxy.ExpoWebBrowser,
    'openBrowserAsync',
    jest.fn(async () => fakeReturnValue)
  );
}

describeCrossPlatform('WebBrowser', () => {
  beforeEach(() => {
    applyMocks();
  });

  afterEach(() => {
    unmockAllProperties();
  });

  it('openBrowserAsync returns correctly', async () => {
    const pageUrl = 'http://expo.io';
    const openResult = await WebBrowser.openBrowserAsync(pageUrl);
    expect(openResult).toEqual(fakeReturnValue);
    expect(NativeModulesProxy.ExpoWebBrowser.openBrowserAsync).toHaveBeenCalledWith(pageUrl, {});
  });

  it('dismissBrowser returns nothing', () => {
    const closeResult = WebBrowser.dismissBrowser();
    expect(closeResult).toBeUndefined();
    expect(NativeModulesProxy.ExpoWebBrowser.dismissBrowser).toHaveBeenCalledTimes(1);
  });
});
