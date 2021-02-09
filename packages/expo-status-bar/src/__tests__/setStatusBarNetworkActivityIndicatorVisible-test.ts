import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { setStatusBarNetworkActivityIndicatorVisible } from '../StatusBar';
import { mockProperty } from './Helpers';

describe('setStatusBarNetworkActivityIndicatorVisible', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setNetworkActivityIndicatorVisible', mock, () => {
      setStatusBarNetworkActivityIndicatorVisible(false);
      expect(mock).toHaveBeenCalledWith(false);
    });
  });
});
