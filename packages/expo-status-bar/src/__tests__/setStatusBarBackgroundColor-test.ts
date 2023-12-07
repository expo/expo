import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { mockProperty } from './Helpers';
import { setStatusBarBackgroundColor } from '../StatusBar';

describe('setStatusBarBackgroundColor', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setBackgroundColor', mock, () => {
      setStatusBarBackgroundColor('#000', true);
      expect(mock).toHaveBeenCalledWith('#000', true);
    });
  });
});
