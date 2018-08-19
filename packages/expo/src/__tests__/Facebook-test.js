import { NativeModules } from 'react-native';
import Facebook from '../Facebook';

import { describeCrossPlatform, mockProperty, unmockAllProperties } from '../../test/mocking';

const fakeReturnValue = { type: 'dismissed' };

function applyMocks() {
  mockProperty(
    NativeModules.ExponentWebBrowser,
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
      some: 'options',
    });
    expect(NativeModules.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      'appId',
      { some: 'options' }
    );
  });

  it('converts to appId string when called with a number parameter', () => {
    Facebook.logInWithReadPermissionsAsync(1234, {
      some: 'options',
    });
    expect(NativeModules.ExponentFacebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith(
      '1234',
      { some: 'options' }
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.mock.calls[0][0]).toMatchSnapshot('warning');
  });
});
