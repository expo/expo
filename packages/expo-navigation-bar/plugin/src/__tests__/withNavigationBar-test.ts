import { resolveProps, setStrings } from '../withNavigationBar';

describe(resolveProps, () => {
  it(`resolves no props`, () => {
    expect(resolveProps({ slug: '', name: '' })).toStrictEqual({
      appearance: undefined,
      backgroundColor: undefined,
      legacyVisible: undefined,
    });
  });
  it(`resolves legacy props`, () => {
    expect(
      resolveProps({
        slug: '',
        name: '',
        androidNavigationBar: {
          visible: 'leanback',
          backgroundColor: '#fff000',
          barStyle: 'light-content',
        },
      })
    ).toStrictEqual({
      appearance: 'light',
      backgroundColor: '#fff000',
      legacyVisible: 'leanback',
    });
  });
  it(`skips legacy props if any config plugin props are provided`, () => {
    expect(
      resolveProps(
        {
          slug: '',
          name: '',
          androidNavigationBar: {
            visible: 'leanback',
            backgroundColor: '#fff000',
            barStyle: 'light-content',
          },
        },
        // config plugin props
        {}
      )
    ).toStrictEqual({});
  });
  it(`resolves config plugin props`, () => {
    expect(
      resolveProps(
        { slug: '', name: '' },
        // config plugin props
        {
          appearance: 'dark',
          backgroundColor: 'blue',
          behavior: 'inset-swipe',
          borderColor: 'green',
          position: 'absolute',
          visibility: 'hidden',
          legacyVisible: 'immersive',
        }
      )
    ).toStrictEqual({
      appearance: 'dark',
      backgroundColor: 'blue',
      behavior: 'inset-swipe',
      borderColor: 'green',
      legacyVisible: 'immersive',
      position: 'absolute',
      visibility: 'hidden',
    });
  });
});

describe(setStrings, () => {
  function getAllProps() {
    return resolveProps(
      { slug: '', name: '' },
      // config plugin props
      {
        appearance: 'dark',
        backgroundColor: 'blue',
        behavior: 'inset-swipe',
        borderColor: 'green',
        position: 'absolute',
        visibility: 'hidden',
        legacyVisible: 'immersive',
      }
    );
  }
  it(`asserts an invalid color`, () => {
    expect(() =>
      setStrings(
        { resources: {} },
        resolveProps({ slug: '', name: '' }, { backgroundColor: '-bacon-' })
      )
    ).toThrow(/Invalid color value: -bacon-/);
  });

  it(`sets all strings`, () => {
    expect(setStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_navigation_bar_background_color',
              translatable: 'false',
            },
            _: '4278190335',
          },
          {
            $: {
              name: 'expo_navigation_bar_border_color',
              translatable: 'false',
            },
            _: '4278222848',
          },
          {
            $: {
              name: 'expo_navigation_bar_appearance',
              translatable: 'false',
            },
            _: 'dark',
          },
          {
            $: {
              name: 'expo_navigation_bar_visibility',
              translatable: 'false',
            },
            _: 'hidden',
          },
          {
            $: {
              name: 'expo_navigation_bar_position',
              translatable: 'false',
            },
            _: 'absolute',
          },
          {
            $: {
              name: 'expo_navigation_bar_behavior',
              translatable: 'false',
            },
            _: 'inset-swipe',
          },
          {
            $: {
              name: 'expo_navigation_bar_legacy_visible',
              translatable: 'false',
            },
            _: 'immersive',
          },
        ],
      },
    });
  });

  it(`sets no strings`, () => {
    expect(
      setStrings(
        {
          resources: {
            string: [],
          },
        },
        {}
      )
    ).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });
  it(`unsets string`, () => {
    // Set all strings
    const strings = setStrings({ resources: {} }, getAllProps());
    // Unset all strings
    expect(setStrings(strings, resolveProps({ name: '', slug: '' }))).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });
  it(`redefines duplicates`, () => {
    // Set all strings
    const strings = setStrings({ resources: {} }, { backgroundColor: '#4630EB' });

    expect(strings.resources.string).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_background_color', translatable: 'false' },
        // Test an initial value
        _: '-12177173',
      },
    ]);
    expect(
      setStrings(strings, resolveProps({ name: '', slug: '' }, { backgroundColor: 'dodgerblue' }))
        .resources.string
    ).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_background_color', translatable: 'false' },
        // Test a redefined value
        _: '-14774017',
      },
    ]);
  });
});
