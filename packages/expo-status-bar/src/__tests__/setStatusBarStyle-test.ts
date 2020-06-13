import { Platform, StatusBar as ReactNativeStatusBar } from 'react-native';

import { setStatusBarStyle } from '../StatusBar';
import { mockProperty, mockAppearance } from './Helpers';

if (Platform.OS === 'web') {
  describe('setStatusBarStyle', () => {
    it('delegates to the React Native StatusBar equivalent and assumes light theme', () => {
      const mock = jest.fn();
      mockProperty(ReactNativeStatusBar, 'setBarStyle', mock, () => {
        setStatusBarStyle('auto');
        expect(mock).toHaveBeenCalledWith('dark-content');
      });
    });
  });
} else {
  describe('setStatusBarStyle', () => {
    it('delegates to the React Native StatusBar equivalent and remaps style to barStyle', () => {
      const mock = jest.fn();
      mockProperty(ReactNativeStatusBar, 'setBarStyle', mock, () => {
        mockAppearance('dark', () => {
          setStatusBarStyle('auto');
          expect(mock).toHaveBeenCalledWith('light-content');
        });
      });
    });
  });
}
