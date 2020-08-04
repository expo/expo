import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { setStatusBarBackgroundColor } from '../StatusBar';
import { mockProperty } from './Helpers';

describe('setStatusBarBackgroundColor', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setBackgroundColor', mock, () => {
      setStatusBarBackgroundColor('#000', true);
      expect(mock).toHaveBeenCalledWith('#000', true);
    });
  });
});
