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
    let openResult = await WebBrowser.openBrowserAsync('http://expo.io');
    expect(openResult).toEqual(fakeReturnValue);
    expect(NativeModulesProxy.ExponentWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      'http://expo.io'
    );
  });

  it('dismissBrowser returns nothing', () => {
    let closeResult = WebBrowser.dismissBrowser();
    expect(closeResult).toBeUndefined();
    expect(NativeModulesProxy.ExponentWebBrowser.dismissBrowser).toHaveBeenCalledTimes(1);
  });
});
