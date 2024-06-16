import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { mockProperty } from './Helpers';
import { setStatusBarTranslucent } from '../StatusBar';

describe('setStatusBarTranslucent', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setTranslucent', mock, () => {
      setStatusBarTranslucent(false);
      expect(mock).toHaveBeenCalledWith(false);
    });
  });
});
