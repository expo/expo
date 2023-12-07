import { Platform, StatusBar as ReactNativeStatusBar } from 'react-native';

import { mockProperty, mockAppearance } from './Helpers';
import { setStatusBarStyle } from '../StatusBar';

if (Platform.OS === 'web') {
  describe('setStatusBarStyle', () => {
    it('delegates to the React Native StatusBar equivalent and assumes light theme', () => {
      const mock = jest.fn();
      mockProperty(ReactNativeStatusBar, 'setBarStyle', mock, () => {
        setStatusBarStyle('auto');
        expect(mock).toHaveBeenCalledWith('dark-content', undefined);
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
          expect(mock).toHaveBeenCalledWith('light-content', undefined);
        });
      });
    });

    it('delegates to the React Native StatusBar equivalent, remaps style to barStyle and passes animated value correctly', () => {
      const mock = jest.fn();
      mockProperty(ReactNativeStatusBar, 'setBarStyle', mock, () => {
        mockAppearance('dark', () => {
          setStatusBarStyle('auto', true);
          expect(mock).toHaveBeenCalledWith('light-content', true);
        });
      });
    });
  });
}
