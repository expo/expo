import { StyleSheet, Text } from 'react-native';

import { appendStackHeaderPropsToOptions } from '../StackHeaderComponent';

describe(appendStackHeaderPropsToOptions, () => {
  describe('hidden prop', () => {
    it.each([true, false, undefined])(
      'sets headerShown to %s when hidden is %s (defaults to true)',
      (hidden) => {
        const result = appendStackHeaderPropsToOptions({}, { hidden });
        expect(result.headerShown).toBe(hidden === undefined ? true : !hidden);
      }
    );

    it('returns early with just headerShown when hidden is true', () => {
      const result = appendStackHeaderPropsToOptions({}, { hidden: true, blurEffect: 'regular' });
      expect(result).toEqual({ headerShown: false });
    });
  });

  describe('asChild prop', () => {
    it('sets header as function when asChild is true', () => {
      const CustomHeader = <Text>Custom Header</Text>;
      const result = appendStackHeaderPropsToOptions({}, { asChild: true, children: CustomHeader });
      expect(result.header).toBeDefined();
      expect(typeof result.header).toBe('function');
    });

    it('renders children inside header function', () => {
      const CustomHeader = <Text testID="custom">Custom Header</Text>;
      const result = appendStackHeaderPropsToOptions({}, { asChild: true, children: CustomHeader });
      const rendered = (result.header as () => React.ReactNode)();
      expect(rendered).toEqual(CustomHeader);
    });
  });

  describe('children without asChild warning', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('warns when children provided without asChild', () => {
      appendStackHeaderPropsToOptions({}, { children: <Text>Header</Text> });

      expect(consoleSpy).toHaveBeenCalledWith(
        `To render a custom header, set the 'asChild' prop to true on Stack.Header.`
      );
    });

    it('does not warn when asChild is true', () => {
      appendStackHeaderPropsToOptions({}, { asChild: true, children: <Text>Header</Text> });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('transparent prop', () => {
    it.each([true, false, undefined])(
      'sets headerTransparent to %s when transparent is %s',
      (transparent) => {
        const result = appendStackHeaderPropsToOptions({}, { transparent });
        expect(result.headerTransparent).toBe(transparent);
      }
    );

    it('auto-enables transparency when backgroundColor is transparent', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        { style: { backgroundColor: 'transparent' } }
      );
      expect(result.headerTransparent).toBe(true);
    });

    it('auto-enables transparency when blurEffect is set', () => {
      const result = appendStackHeaderPropsToOptions({}, { blurEffect: 'regular' });
      expect(result.headerTransparent).toBe(true);
    });

    it('does not auto-enable transparency when transparent is explicitly false', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        { transparent: false, style: { backgroundColor: 'transparent' } }
      );
      expect(result.headerTransparent).toBe(false);
    });
  });

  describe('blurEffect warning', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('warns when blurEffect is set but transparent is explicitly false', () => {
      appendStackHeaderPropsToOptions({}, { blurEffect: 'regular', transparent: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        `Stack.Header: 'blurEffect' requires 'transparent' to be enabled.`
      );
    });

    it('does not warn when blurEffect is set without transparent prop', () => {
      appendStackHeaderPropsToOptions({}, { blurEffect: 'regular' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('does not warn when blurEffect is set with transparent true', () => {
      appendStackHeaderPropsToOptions({}, { blurEffect: 'regular', transparent: true });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('blurEffect prop', () => {
    it('sets headerBlurEffect', () => {
      const result = appendStackHeaderPropsToOptions({}, { blurEffect: 'systemMaterial' });
      expect(result.headerBlurEffect).toBe('systemMaterial');
    });

    it.each(['regular', 'prominent', 'systemMaterial', 'systemThinMaterial'] as const)(
      'accepts blurEffect value %s',
      (blurEffect) => {
        const result = appendStackHeaderPropsToOptions({}, { blurEffect });
        expect(result.headerBlurEffect).toBe(blurEffect);
      }
    );
  });

  describe('style prop', () => {
    it('maps style.color to headerTintColor', () => {
      const result = appendStackHeaderPropsToOptions({}, { style: { color: 'red' } });
      expect(result.headerTintColor).toBe('red');
    });

    it('maps style.backgroundColor to headerStyle.backgroundColor', () => {
      const result = appendStackHeaderPropsToOptions({}, { style: { backgroundColor: 'white' } });
      const flattenedStyle = StyleSheet.flatten(result.headerStyle || {});
      expect(flattenedStyle.backgroundColor).toBe('white');
    });

    it('maps shadowColor transparent to headerShadowVisible false', () => {
      const result = appendStackHeaderPropsToOptions({}, { style: { shadowColor: 'transparent' } });
      expect(result.headerShadowVisible).toBe(false);
    });

    it('does not set headerShadowVisible when shadowColor is not transparent', () => {
      const result = appendStackHeaderPropsToOptions({}, { style: { backgroundColor: 'white' } });
      expect(result.headerShadowVisible).toBeUndefined();
    });
  });

  describe('largeStyle prop', () => {
    it('maps largeStyle.backgroundColor to headerLargeStyle.backgroundColor', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        { largeStyle: { backgroundColor: 'blue' } }
      );
      const flattenedStyle = StyleSheet.flatten(result.headerLargeStyle || {});
      expect(flattenedStyle.backgroundColor).toBe('blue');
    });

    it('maps largeStyle.shadowColor transparent to headerLargeTitleShadowVisible false', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        { largeStyle: { shadowColor: 'transparent' } }
      );
      expect(result.headerLargeTitleShadowVisible).toBe(false);
    });

    it('does not set headerLargeTitleShadowVisible when shadowColor is not transparent', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        { largeStyle: { backgroundColor: 'white' } }
      );
      expect(result.headerLargeTitleShadowVisible).toBeUndefined();
    });
  });

  describe('options merging', () => {
    it('merges with existing options', () => {
      const existingOptions = { title: 'Page Title', headerBackTitle: 'Back' };
      const result = appendStackHeaderPropsToOptions(existingOptions, {
        style: { backgroundColor: 'white' },
      });
      expect(result.title).toBe('Page Title');
      expect(result.headerBackTitle).toBe('Back');
      const flattenedStyle = StyleSheet.flatten(result.headerStyle || {});
      expect(flattenedStyle.backgroundColor).toBe('white');
    });

    it('overwrites conflicting options', () => {
      const existingOptions = { headerBlurEffect: 'regular' as const };
      const result = appendStackHeaderPropsToOptions(existingOptions, {
        blurEffect: 'prominent',
      });
      expect(result.headerBlurEffect).toBe('prominent');
    });
  });

  describe('combined props', () => {
    it('handles multiple props together', () => {
      const result = appendStackHeaderPropsToOptions(
        {},
        {
          blurEffect: 'systemMaterial',
          transparent: true,
          style: { color: 'blue', backgroundColor: 'rgba(255,255,255,0.8)' },
          largeStyle: { backgroundColor: 'white' },
        }
      );

      expect(result).toMatchObject({
        headerShown: true,
        headerBlurEffect: 'systemMaterial',
        headerTransparent: true,
        headerTintColor: 'blue',
        headerStyle: { backgroundColor: 'rgba(255,255,255,0.8)' },
        headerLargeStyle: { backgroundColor: 'white' },
      });
    });
  });
});
