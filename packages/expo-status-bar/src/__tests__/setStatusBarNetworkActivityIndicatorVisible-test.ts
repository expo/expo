import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { mockProperty } from './Helpers';
import { setStatusBarNetworkActivityIndicatorVisible } from '../StatusBar';

describe('setStatusBarNetworkActivityIndicatorVisible', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setNetworkActivityIndicatorVisible', mock, () => {
      setStatusBarNetworkActivityIndicatorVisible(false);
      expect(mock).toHaveBeenCalledWith(false);
    });
  });
});
