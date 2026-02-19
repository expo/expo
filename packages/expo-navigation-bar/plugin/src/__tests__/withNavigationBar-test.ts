import {
  resolveProps,
  setStrings,
  withAndroidNavigationBarExpoGoManifest,
} from '../withNavigationBar';

describe(resolveProps, () => {
  it(`resolves no props`, () => {
    expect(resolveProps({})).toStrictEqual({
      barStyle: undefined,
    });
  });
  it(`resolves props`, () => {
    expect(
      resolveProps({
        androidNavigationBar: {
          barStyle: 'light-content',
        },
      })
    ).toStrictEqual({
      barStyle: 'light',
    });
  });
  it(`skips props if any config plugin props are provided`, () => {
    expect(
      resolveProps(
        {
          androidNavigationBar: {
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
        {},
        // config plugin props
        {
          barStyle: 'dark',
          visibility: 'hidden',
        }
      )
    ).toStrictEqual({
      barStyle: 'dark',
      visibility: 'hidden',
    });
  });
});

describe(setStrings, () => {
  function getAllProps() {
    return resolveProps(
      {},
      // config plugin props
      {
        barStyle: 'dark',
        visibility: 'hidden',
      }
    );
  }

  it(`sets all strings`, () => {
    expect(setStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_navigation_bar_visibility',
              translatable: 'false',
            },
            _: 'hidden',
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
    expect(setStrings(strings, resolveProps({}))).toStrictEqual({
      resources: {
        string: [],
      },
    });
  });
  it(`redefines duplicates`, () => {
    // Set all strings
    const strings = setStrings({ resources: {} }, { visibility: 'hidden' });

    expect(strings.resources.string).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_visibility', translatable: 'false' },
        // Test an initial value
        _: 'hidden',
      },
    ]);
    expect(
      setStrings(strings, resolveProps({}, { visibility: 'visible' })).resources.string
    ).toStrictEqual([
      {
        $: { name: 'expo_navigation_bar_visibility', translatable: 'false' },
        // Test a redefined value
        _: 'visible',
      },
    ]);
  });
});

describe(withAndroidNavigationBarExpoGoManifest, () => {
  it(`ensures manifest values`, () => {
    expect(
      withAndroidNavigationBarExpoGoManifest(
        { name: '', slug: '' },
        {
          barStyle: 'dark',
          visibility: 'hidden',
        }
      )
    ).toStrictEqual({
      name: expect.any(String),
      slug: expect.any(String),
      androidNavigationBar: {
        // Ensure `content` is added
        barStyle: 'dark-content',
      },
    });
  });
});
