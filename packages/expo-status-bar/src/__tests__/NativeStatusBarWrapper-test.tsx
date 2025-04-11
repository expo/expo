import * as React from 'react';

import { mockAppearance, renderedPropValue } from './Helpers';
import { StatusBar as ExpoStatusBar } from '../NativeStatusBarWrapper';

describe('StatusBar', () => {
  describe('style', () => {
    jest.useFakeTimers();

    it('uses light-content instead of default when dark mode', () => {
      mockAppearance('dark', () => {
        expect(renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe('light-content');
        jest.runAllTimers();
      });
    });

    it('uses dark-content instead of default when light mode', () => {
      mockAppearance('light', () => {
        expect(renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe('dark-content');
        jest.runAllTimers();
      });
    });

    it('uses light-content when inverted in light mode', () => {
      mockAppearance('light', () => {
        expect(renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'light-content'
        );
        jest.runAllTimers();
      });
    });

    it('uses dark-content when inverted in dark mode', () => {
      mockAppearance('dark', () => {
        expect(renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'dark-content'
        );
        jest.runAllTimers();
      });
    });

    it('translates light to light-content and dark to dark-content', () => {
      expect(renderedPropValue(<ExpoStatusBar style="light" />, 'barStyle')).toBe('light-content');
      expect(renderedPropValue(<ExpoStatusBar style="dark" />, 'barStyle')).toBe('dark-content');
    });
  });
});
