import { resolveProps, setStrings } from '../withAndroidUserInterfaceStyle';

describe(resolveProps, () => {
  it(`resolves no props`, () => {
    expect(resolveProps({})).toStrictEqual({
      userInterfaceStyle: undefined,
    });
  });

  it(`uses more specific key`, () => {
    expect(
      resolveProps({
        userInterfaceStyle: 'dark',
        android: {
          userInterfaceStyle: 'light',
        },
      })
    ).toStrictEqual({
      userInterfaceStyle: 'light',
    });
  });
});

describe(setStrings, () => {
  function getAllProps() {
    return resolveProps({ userInterfaceStyle: 'dark' });
  }
  // TODO: Should we do validation on backgroundColor just for convenience?
  it(`asserts an invalid color`, () => {
    expect(() =>
      setStrings(
        { resources: {} },
        resolveProps({
          // @ts-expect-error
          userInterfaceStyle: '-bacon-',
        })
      )
    ).toThrow(/expo-system-ui: Invalid userInterfaceStyle: "-bacon-"/);
  });

  it(`sets all strings`, () => {
    expect(setStrings({ resources: {} }, getAllProps())).toStrictEqual({
      resources: {
        string: [
          {
            $: {
              name: 'expo_system_ui_user_interface_style',
              translatable: 'false',
            },
            _: 'dark',
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
    const strings = setStrings({ resources: {} }, { userInterfaceStyle: 'dark' });

    expect(strings.resources.string).toStrictEqual([
      {
        $: {
          name: 'expo_system_ui_user_interface_style',
          translatable: 'false',
        },
        // Test an initial value
        _: 'dark',
      },
    ]);

    expect(
      setStrings(strings, resolveProps({ userInterfaceStyle: 'light' })).resources.string
    ).toStrictEqual([
      {
        $: { name: 'expo_system_ui_user_interface_style', translatable: 'false' },
        // Test a redefined value
        _: 'light',
      },
    ]);
  });
});
