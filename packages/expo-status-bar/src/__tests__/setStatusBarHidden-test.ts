import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { setStatusBarHidden } from '../StatusBar';
import { mockProperty } from './Helpers';

describe('setStatusBarHidden', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setHidden', mock, () => {
      setStatusBarHidden(false, 'none');
      expect(mock).toHaveBeenCalledWith(false, 'none');
    });
  });
});
