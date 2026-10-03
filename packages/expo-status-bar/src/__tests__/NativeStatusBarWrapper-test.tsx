import { StatusBar as ExpoStatusBar } from '../NativeStatusBarWrapper';
import { mockAppearance, mockNativeStatusBar, renderedPropValue } from './Helpers';

mockNativeStatusBar();

describe('StatusBar', () => {
  describe('style', () => {
    jest.useFakeTimers();

    it('uses light-content instead of default when dark mode', async () => {
      await mockAppearance('dark', async () => {
        expect(await renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe(
          'light-content'
        );
        jest.runAllTimers();
      });
    });

    it('uses dark-content instead of default when light mode', async () => {
      await mockAppearance('light', async () => {
        expect(await renderedPropValue(<ExpoStatusBar style="auto" />, 'barStyle')).toBe(
          'dark-content'
        );
        jest.runAllTimers();
      });
    });

    it('uses light-content when inverted in light mode', async () => {
      await mockAppearance('light', async () => {
        expect(await renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'light-content'
        );
        jest.runAllTimers();
      });
    });

    it('uses dark-content when inverted in dark mode', async () => {
      await mockAppearance('dark', async () => {
        expect(await renderedPropValue(<ExpoStatusBar style="inverted" />, 'barStyle')).toBe(
          'dark-content'
        );
        jest.runAllTimers();
      });
    });

    it('translates light to light-content and dark to dark-content', async () => {
      expect(await renderedPropValue(<ExpoStatusBar style="light" />, 'barStyle')).toBe(
        'light-content'
      );
      expect(await renderedPropValue(<ExpoStatusBar style="dark" />, 'barStyle')).toBe(
        'dark-content'
      );
    });
  });
});
