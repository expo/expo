import { StatusBar as ReactNativeStatusBar } from 'react-native';

import { setStatusBarTranslucent } from '../StatusBar';
import { mockProperty } from './Helpers';

describe('setStatusBarTranslucent', () => {
  it('delegates to the React Native StatusBar equivalent', () => {
    const mock = jest.fn();
    mockProperty(ReactNativeStatusBar, 'setTranslucent', mock, () => {
      setStatusBarTranslucent(false);
      expect(mock).toHaveBeenCalledWith(false);
    });
  });
});
