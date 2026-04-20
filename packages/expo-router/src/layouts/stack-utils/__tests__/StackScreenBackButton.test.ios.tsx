import { appendStackScreenBackButtonPropsToOptions } from '../screen/StackScreenBackButton';

describe(appendStackScreenBackButtonPropsToOptions, () => {
  describe('headerBackTitle from children', () => {
    it('sets headerBackTitle from children', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, { children: 'Back' });
      expect(result.headerBackTitle).toBe('Back');
    });

    it('sets headerBackTitle to undefined when no children', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, {});
      expect(result.headerBackTitle).toBeUndefined();
    });

    it('sets headerBackTitle to empty string when children is empty', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, { children: '' });
      expect(result.headerBackTitle).toBe('');
    });
  });

  describe('headerBackTitleStyle from style', () => {
    it('sets headerBackTitleStyle from style', () => {
      const style = { fontSize: 14, fontWeight: 'bold' as const };
      const result = appendStackScreenBackButtonPropsToOptions({}, { style });
      expect(result.headerBackTitleStyle).toEqual(style);
    });

    it('does not set headerBackTitleStyle when style is undefined', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, {});
      expect(result.headerBackTitleStyle).toBeUndefined();
    });
  });

  describe('headerBackImageSource from src', () => {
    it('sets headerBackImageSource from src', () => {
      const src = { uri: 'https://example.com/back.png' };
      const result = appendStackScreenBackButtonPropsToOptions({}, { src });
      expect(result.headerBackImageSource).toEqual(src);
    });

    it('sets headerBackImageSource from require-style source', () => {
      const src = 123; // Simulating require('image.png') which returns a number
      const result = appendStackScreenBackButtonPropsToOptions({}, { src });
      expect(result.headerBackImageSource).toBe(123);
    });

    it('does not set headerBackImageSource when src is undefined', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, {});
      expect(result.headerBackImageSource).toBeUndefined();
    });
  });

  describe('headerBackButtonDisplayMode from displayMode', () => {
    it.each(['minimal', 'default', 'generic'] as const)(
      'sets headerBackButtonDisplayMode to %s',
      (displayMode) => {
        const result = appendStackScreenBackButtonPropsToOptions({}, { displayMode });
        expect(result.headerBackButtonDisplayMode).toBe(displayMode);
      }
    );

    it('does not set headerBackButtonDisplayMode when displayMode is undefined', () => {
      const result = appendStackScreenBackButtonPropsToOptions({}, {});
      expect(result.headerBackButtonDisplayMode).toBeUndefined();
    });
  });

  describe('headerBackButtonMenuEnabled from withMenu', () => {
    it.each([true, false, undefined])(
      'sets headerBackButtonMenuEnabled to %s when withMenu is %s',
      (value) => {
        const result = appendStackScreenBackButtonPropsToOptions({}, { withMenu: value });
        expect(result.headerBackButtonMenuEnabled).toBe(value);
      }
    );
  });

  describe('headerBackVisible from hidden', () => {
    it.each([true, false, undefined])(
      'sets headerBackVisible to %s when hidden is %s (defaults to true)',
      (hidden) => {
        const result = appendStackScreenBackButtonPropsToOptions({}, { hidden });
        expect(result.headerBackVisible).toBe(hidden === undefined ? true : !hidden);
      }
    );
  });

  describe('options merging', () => {
    it('merges with existing options', () => {
      const existingOptions = { headerShown: true, title: 'Page Title' };
      const result = appendStackScreenBackButtonPropsToOptions(existingOptions, {
        children: 'Back',
      });
      expect(result.headerShown).toBe(true);
      expect(result.title).toBe('Page Title');
      expect(result.headerBackTitle).toBe('Back');
    });

    it('overwrites conflicting options', () => {
      const existingOptions = { headerBackTitle: 'Old Back' };
      const result = appendStackScreenBackButtonPropsToOptions(existingOptions, {
        children: 'New Back',
      });
      expect(result.headerBackTitle).toBe('New Back');
    });
  });

  describe('combined props', () => {
    it('handles all props together', () => {
      const result = appendStackScreenBackButtonPropsToOptions(
        {},
        {
          children: 'Go Back',
          style: { fontSize: 14 },
          src: { uri: 'https://example.com/back.png' },
          displayMode: 'minimal',
          withMenu: true,
          hidden: false,
        }
      );

      expect(result).toEqual({
        headerBackTitle: 'Go Back',
        headerBackTitleStyle: { fontSize: 14 },
        headerBackImageSource: { uri: 'https://example.com/back.png' },
        headerBackButtonDisplayMode: 'minimal',
        headerBackButtonMenuEnabled: true,
        headerBackVisible: true,
      });
    });
  });
});
