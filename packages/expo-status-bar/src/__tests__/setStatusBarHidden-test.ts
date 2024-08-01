import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { mockProperty } from './Helpers';
import { setStatusBarHidden } from '../StatusBar';

describe('setStatusBarHidden', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setHidden', mock, () => {
      setStatusBarHidden(false, 'none');
      expect(mock).toHaveBeenCalledWith(false, 'none');
    });
  });
});
