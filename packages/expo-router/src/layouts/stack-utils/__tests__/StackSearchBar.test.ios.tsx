import { appendStackSearchBarPropsToOptions } from '../StackSearchBar';

describe(appendStackSearchBarPropsToOptions, () => {
  describe('headerShown', () => {
    it('sets headerShown to true', () => {
      const result = appendStackSearchBarPropsToOptions({}, {});
      expect(result.headerShown).toBe(true);
    });

    it('always sets headerShown to true even if existing options have it false', () => {
      const result = appendStackSearchBarPropsToOptions({ headerShown: false }, {});
      expect(result.headerShown).toBe(true);
    });
  });

  describe('headerSearchBarOptions', () => {
    it('passes placeholder prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { placeholder: 'Search...' });
      expect(result.headerSearchBarOptions).toEqual({
        placeholder: 'Search...',
      });
    });

    it.each(['onChangeText', 'onSearchButtonPress', 'onCancelButtonPress', 'onFocus', 'onBlur'])(
      'passes %s callback prop',
      (propName) => {
        const callback = jest.fn();
        const result = appendStackSearchBarPropsToOptions({}, { [propName]: callback });
        expect(result.headerSearchBarOptions?.[propName]).toBe(callback);
      }
    );

    it.each(['none', 'words', 'sentences', 'characters'] as const)(
      'passes autoCapitalize=%s prop',
      (autoCapitalize) => {
        const result = appendStackSearchBarPropsToOptions({}, { autoCapitalize });
        expect(result.headerSearchBarOptions?.autoCapitalize).toBe(autoCapitalize);
      }
    );

    it.each(['text', 'number', 'email', 'phone'] as const)(
      'passes inputType=%s prop',
      (inputType) => {
        const result = appendStackSearchBarPropsToOptions({}, { inputType });
        expect(result.headerSearchBarOptions?.inputType).toBe(inputType);
      }
    );

    it('passes cancelButtonText prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { cancelButtonText: 'Cancel' });
      expect(result.headerSearchBarOptions?.cancelButtonText).toBe('Cancel');
    });

    it.each([true, false, undefined])('passes hideWhenScrolling=%s prop', (hideWhenScrolling) => {
      const result = appendStackSearchBarPropsToOptions({}, { hideWhenScrolling });
      expect(result.headerSearchBarOptions?.hideWhenScrolling).toBe(hideWhenScrolling);
    });

    it.each([true, false, undefined])('passes obscureBackground=%s prop', (obscureBackground) => {
      const result = appendStackSearchBarPropsToOptions({}, { obscureBackground });
      expect(result.headerSearchBarOptions?.obscureBackground).toBe(obscureBackground);
    });

    it.each([true, false, undefined])('passes hideNavigationBar=%s prop', (hideNavigationBar) => {
      const result = appendStackSearchBarPropsToOptions({}, { hideNavigationBar });
      expect(result.headerSearchBarOptions?.hideNavigationBar).toBe(hideNavigationBar);
    });

    it('passes barTintColor prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { barTintColor: 'white' });
      expect(result.headerSearchBarOptions?.barTintColor).toBe('white');
    });

    it('passes tintColor prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { tintColor: 'blue' });
      expect(result.headerSearchBarOptions?.tintColor).toBe('blue');
    });

    it('passes textColor prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { textColor: 'black' });
      expect(result.headerSearchBarOptions?.textColor).toBe('black');
    });

    it('passes hintTextColor prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { hintTextColor: 'gray' });
      expect(result.headerSearchBarOptions?.hintTextColor).toBe('gray');
    });

    it('passes headerIconColor prop', () => {
      const result = appendStackSearchBarPropsToOptions({}, { headerIconColor: 'gray' });
      expect(result.headerSearchBarOptions?.headerIconColor).toBe('gray');
    });

    it.each([true, false, undefined])(
      'passes shouldShowHintSearchIcon=%s prop',
      (shouldShowHintSearchIcon) => {
        const result = appendStackSearchBarPropsToOptions({}, { shouldShowHintSearchIcon });
        expect(result.headerSearchBarOptions?.shouldShowHintSearchIcon).toBe(
          shouldShowHintSearchIcon
        );
      }
    );
  });

  describe('options merging', () => {
    it('merges with existing options', () => {
      const existingOptions = { title: 'Page Title', headerBackTitle: 'Back' };
      const result = appendStackSearchBarPropsToOptions(existingOptions, {
        placeholder: 'Search...',
      });
      expect(result.title).toBe('Page Title');
      expect(result.headerBackTitle).toBe('Back');
      expect(result.headerSearchBarOptions?.placeholder).toBe('Search...');
    });

    it('overwrites headerShown in existing options', () => {
      const existingOptions = { headerShown: false };
      const result = appendStackSearchBarPropsToOptions(existingOptions, {});
      expect(result.headerShown).toBe(true);
    });
  });

  describe('combined props', () => {
    it('handles multiple search bar props together', () => {
      const onChangeText = jest.fn();
      const onSearchButtonPress = jest.fn();

      const result = appendStackSearchBarPropsToOptions(
        {},
        {
          placeholder: 'Search items...',
          onChangeText,
          onSearchButtonPress,
          autoCapitalize: 'words',
          hideWhenScrolling: false,
          barTintColor: 'white',
          tintColor: 'blue',
        }
      );

      expect(result.headerSearchBarOptions).toEqual({
        placeholder: 'Search items...',
        onChangeText,
        onSearchButtonPress,
        autoCapitalize: 'words',
        hideWhenScrolling: false,
        barTintColor: 'white',
        tintColor: 'blue',
      });
    });
  });
});
