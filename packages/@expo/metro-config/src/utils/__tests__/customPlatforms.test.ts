import {
  createCustomPlatformResolver,
  resolveCustomPlatforms,
  type CustomPlatform,
} from '../customPlatforms';

const macos: CustomPlatform = { name: 'macos', package: 'react-native-macos' };
const windows: CustomPlatform = { name: 'windows', package: 'react-native-windows' };

describe(resolveCustomPlatforms, () => {
  it('returns `null` when no custom platforms are resolved', () => {
    expect(resolveCustomPlatforms({}, [])).toBe(null);
    expect(resolveCustomPlatforms({ dependencies: { expo: '^53.0.0' } }, [macos])).toBe(null);
    expect(resolveCustomPlatforms({ dependencies: { expo: '^53.0.0' } }, [windows])).toBe(null);
  });

  it('returns an object with resolved custom platforms', () => {
    expect(
      resolveCustomPlatforms({ dependencies: { [macos.package]: '0.79.0' } }, [macos])
    ).toMatchObject({ [macos.name]: macos.package });
    expect(
      resolveCustomPlatforms({ dependencies: { [windows.package]: '0.79.0' } }, [windows])
    ).toMatchObject({ [windows.name]: windows.package });
    expect(
      resolveCustomPlatforms(
        { dependencies: { [macos.package]: '0.79.0', [windows.package]: '0.79.0' } },
        [macos, windows]
      )
    ).toMatchObject({
      [macos.name]: macos.package,
      [windows.name]: windows.package,
    });
  });

  it('resolves known custom platforms when using `true`', () => {
    expect(
      resolveCustomPlatforms(
        { dependencies: { [macos.package]: '0.79.0', [windows.package]: '0.79.0' } },
        true
      )
    ).toMatchObject({
      [macos.name]: macos.package,
      [windows.name]: windows.package,
    });
  });
});

describe(createCustomPlatformResolver, () => {
  it('returns `undefined` when no custom platforms are resolved', () => {
    expect(createCustomPlatformResolver(null)).toBeUndefined();
  });

  it('returns resolver when one or more custom platforms are defined', () => {
    expect(createCustomPlatformResolver({ [macos.name]: macos.package })).toBeInstanceOf(Function);
    expect(createCustomPlatformResolver({ [windows.name]: windows.package })).toBeInstanceOf(
      Function
    );
    expect(
      createCustomPlatformResolver({
        [macos.name]: macos.package,
        [windows.name]: windows.package,
      })
    ).toBeInstanceOf(Function);
  });

  const context = {
    // Create a custom context that returns the remapped module import for test assertions
    resolveRequest: jest.fn((_, moduleImport, __) => moduleImport),
  } as any;

  it('does not rewrite `react-native` paths for non-custom platforms', () => {
    const resolver = createCustomPlatformResolver({
      [macos.name]: macos.package,
      [windows.name]: windows.package,
    });

    expect(resolver(context, 'react-native', 'android')).toBe('react-native');
    expect(resolver(context, 'react-native', 'ios')).toBe('react-native');
    expect(resolver(context, 'react-native', 'web')).toBe('react-native');

    expect(resolver(context, 'react-native/nested/import', 'android')).toBe(
      'react-native/nested/import'
    );
    expect(resolver(context, 'react-native/nested/import', 'ios')).toBe(
      'react-native/nested/import'
    );
    expect(resolver(context, 'react-native/nested/import', 'web')).toBe(
      'react-native/nested/import'
    );
  });

  it('rewrites `react-native` paths to custom platforms', () => {
    const resolver = createCustomPlatformResolver({
      [macos.name]: macos.package,
      [windows.name]: windows.package,
    });

    expect(resolver(context, 'react-native', macos.name)).toBe(macos.package);
    expect(resolver(context, 'react-native', windows.name)).toBe(windows.package);
    expect(resolver(context, 'react-native/nested/import', macos.name)).toBe(
      `${macos.package}/nested/import`
    );
    expect(resolver(context, 'react-native/nested/import', windows.name)).toBe(
      `${windows.package}/nested/import`
    );

    // Imports matching `react-native*` patterns, but should not be remapped
    expect(resolver(context, 'react-native-reanimated', macos.name)).toBe(
      'react-native-reanimated'
    );
    expect(resolver(context, 'react-native-reanimated', windows.name)).toBe(
      'react-native-reanimated'
    );
  });

  it('does not rewrite `react-native` paths to unresolved custom platforms', () => {
    const resolver = createCustomPlatformResolver({
      [macos.name]: macos.package,
      // [windows.name]: windows.package, // unresolved custom platform
    });

    expect(resolver(context, 'react-native', macos.name)).toBe(macos.package);
    expect(resolver(context, 'react-native', windows.name)).toBe('react-native'); // unresolved custom platform

    expect(resolver(context, 'react-native/nested/import', macos.name)).toBe(
      `${macos.package}/nested/import`
    );
    // unresolved custom platform
    expect(resolver(context, 'react-native/nested/import', windows.name)).toBe(
      `react-native/nested/import`
    );

    // Imports matching `react-native*` patterns, but should not be remapped
    expect(resolver(context, 'react-native-reanimated', macos.name)).toBe(
      'react-native-reanimated'
    );
    expect(resolver(context, 'react-native-reanimated', windows.name)).toBe(
      'react-native-reanimated'
    );
  });
});
