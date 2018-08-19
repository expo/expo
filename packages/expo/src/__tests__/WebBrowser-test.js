import { NativeModules } from 'react-native';
import WebBrowser from '../WebBrowser';

import { mockProperty, unmockAllProperties, describeCrossPlatform } from '../../test/mocking';

const fakeReturnValue = {
  type: 'cancel',
};

function applyMocks() {
  mockProperty(
    NativeModules.ExponentWebBrowser,
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
    expect(NativeModules.ExponentWebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      'http://expo.io'
    );
  });

  it('dismissBrowser returns nothing', () => {
    let closeResult = WebBrowser.dismissBrowser();
    expect(closeResult).toBeUndefined();
    expect(NativeModules.ExponentWebBrowser.dismissBrowser).toHaveBeenCalledTimes(1);
  });
});
