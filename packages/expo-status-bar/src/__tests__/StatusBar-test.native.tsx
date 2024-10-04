import * as React from 'react';
import { Platform } from 'react-native';

import { mockAppearance, renderedPropValue } from './Helpers';
import { StatusBar as ExpoStatusBar } from '../StatusBar';

describe('StatusBar', () => {
  if (Platform.OS === 'android') {
    describe('translucent', () => {
      it('defaults to translucent', () => {
        expect(renderedPropValue(<ExpoStatusBar />, 'translucent')).toBe(true);
      });

      it('respects the translucent value passed in', () => {
        expect(renderedPropValue(<ExpoStatusBar translucent={false} />, 'translucent')).toBe(false);
      });
    });
  }

  describe('style', () => {
    it('uses light-content instead of default when dark mode', () => {
      mockAppearance('dark', () => {
        expect(renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe('light-content');
      });
    });

    it('uses dark-content instead of default when light mode', () => {
      mockAppearance('light', () => {
        expect(renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe('dark-content');
      });
    });

    it('uses light-content when inverted in light mode', () => {
      mockAppearance('light', () => {
        expect(renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'light-content'
        );
      });
    });

    it('uses dark-content when inverted in dark mode', () => {
      mockAppearance('dark', () => {
        expect(renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'dark-content'
        );
      });
    });

    it('translates light to light-content and dark to dark-content', () => {
      expect(renderedPropValue(<ExpoStatusBar style="light" />, 'barStyle')).toBe('light-content');
      expect(renderedPropValue(<ExpoStatusBar style="dark" />, 'barStyle')).toBe('dark-content');
    });
  });
});
