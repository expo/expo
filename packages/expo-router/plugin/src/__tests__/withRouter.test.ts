import withRouter from '../withRouter';

describe('unstable_chunking', () => {
  it.each([true, false, undefined])('preserves %s without changing async routes', (value) => {
    const config = withRouter({ name: 'test', slug: 'test' }, { unstable_chunking: value });
    expect(config.extra?.router.unstable_chunking).toBe(value);
    expect(config.extra?.router.asyncRoutes).toEqual({ web: true });
  });

  it('allows the plugin option to override an extra.router opt-in', () => {
    const config = withRouter(
      {
        name: 'test',
        slug: 'test',
        extra: { router: { unstable_chunking: true } },
      },
      { unstable_chunking: false }
    );
    expect(config.extra?.router.unstable_chunking).toBe(false);
  });

  it('rejects a non-boolean option', () => {
    expect(() =>
      withRouter(
        { name: 'test', slug: 'test' },
        {
          // @ts-expect-error Verify runtime schema validation for JSON app config.
          unstable_chunking: 'bitset',
        }
      )
    ).toThrow();
  });
});

describe('apiRoutes', () => {
  it.each(['static', 'server'] as const)('accepts API routes with %s output', (output) => {
    const config = withRouter({ name: 'test', slug: 'test', web: { output } }, { apiRoutes: true });
    expect(config.extra?.router.apiRoutes).toBe(true);
  });

  it.each(['single', undefined] as const)('rejects the setting with %s output', (output) => {
    expect(() =>
      withRouter({ name: 'test', slug: 'test', web: { output } }, { apiRoutes: true })
    ).toThrow('The `apiRoutes` option requires `web.output` to be set to `static` or `server`.');
  });

  it.each(['static', 'server', 'single', undefined] as const)(
    'preserves an explicit false value with %s output',
    (output) => {
      const config = withRouter(
        { name: 'test', slug: 'test', web: { output } },
        { apiRoutes: false }
      );
      expect(config.extra?.router.apiRoutes).toBe(false);
    }
  );
});

describe('asyncRoutes', () => {
  it('defaults to enabled only on web', () => {
    const config = withRouter({ name: 'test', slug: 'test' });
    expect(config.extra?.router.asyncRoutes).toEqual({ web: true });
  });

  it('adds the web default to a partial platform configuration', () => {
    const config = withRouter(
      { name: 'test', slug: 'test' },
      { asyncRoutes: { android: 'development' } }
    );
    expect(config.extra?.router.asyncRoutes).toEqual({ android: 'development', web: true });
  });

  it.each([true, false, 'development', 'production'] as const)(
    'preserves the scalar value %p',
    (asyncRoutes) => {
      const config = withRouter({ name: 'test', slug: 'test' }, { asyncRoutes });
      expect(config.extra?.router.asyncRoutes).toBe(asyncRoutes);
    }
  );

  it.each([
    { default: false },
    { default: 'development' as const },
    { web: false },
    { default: false, web: true },
  ])('preserves an explicit web or default value: %p', (asyncRoutes) => {
    const config = withRouter({ name: 'test', slug: 'test' }, { asyncRoutes });
    expect(config.extra?.router.asyncRoutes).toEqual(asyncRoutes);
  });

  it('normalizes an existing router configuration', () => {
    const config = withRouter({
      name: 'test',
      slug: 'test',
      extra: { router: { asyncRoutes: { ios: 'development' } } },
    });
    expect(config.extra?.router.asyncRoutes).toEqual({ ios: 'development', web: true });
  });

  it('preserves an explicit value from an existing router configuration', () => {
    const config = withRouter({
      name: 'test',
      slug: 'test',
      extra: { router: { asyncRoutes: false } },
    });
    expect(config.extra?.router.asyncRoutes).toBe(false);
  });

  it('lets plugin options override existing router settings while preserving other extra values', () => {
    const config = withRouter(
      {
        name: 'test',
        slug: 'test',
        extra: { custom: 'value', router: { asyncRoutes: false, origin: 'https://example.com' } },
      },
      { asyncRoutes: { ios: 'development' } }
    );
    expect(config.extra).toEqual({
      custom: 'value',
      router: { origin: 'https://example.com', asyncRoutes: { ios: 'development', web: true } },
    });
  });
});
