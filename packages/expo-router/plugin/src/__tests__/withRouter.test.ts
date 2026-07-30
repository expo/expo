import withRouter from '../withRouter';

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
  it('defaults to enabled on web', () => {
    expect(
      withRouter({
        name: 'test',
        slug: 'test',
      })
    ).toMatchObject({
      extra: {
        router: {
          asyncRoutes: { web: true },
        },
      },
    });
  });

  it('adds the web default to a partial platform configuration', () => {
    expect(
      withRouter(
        {
          name: 'test',
          slug: 'test',
        },
        { asyncRoutes: { android: 'development' } }
      )
    ).toMatchObject({
      extra: {
        router: {
          asyncRoutes: {
            android: 'development',
            web: true,
          },
        },
      },
    });
  });

  it.each([true, false, 'development', 'production'] as const)(
    'preserves the scalar value %p',
    (asyncRoutes) => {
      expect(
        withRouter(
          {
            name: 'test',
            slug: 'test',
          },
          { asyncRoutes }
        )
      ).toMatchObject({
        extra: {
          router: {
            asyncRoutes,
          },
        },
      });
    }
  );

  it.each([
    { default: false },
    { default: 'development' as const },
    { web: false },
    { default: false, web: true },
  ])('preserves an explicit web or default value: %p', (asyncRoutes) => {
    expect(
      withRouter(
        {
          name: 'test',
          slug: 'test',
        },
        { asyncRoutes }
      )
    ).toMatchObject({
      extra: {
        router: {
          asyncRoutes,
        },
      },
    });
  });

  it('normalizes an existing router configuration', () => {
    expect(
      withRouter({
        name: 'test',
        slug: 'test',
        extra: {
          router: {
            asyncRoutes: { ios: 'development' },
          },
        },
      })
    ).toMatchObject({
      extra: {
        router: {
          asyncRoutes: {
            ios: 'development',
            web: true,
          },
        },
      },
    });
  });

  it('preserves an explicit value from an existing router configuration', () => {
    expect(
      withRouter({
        name: 'test',
        slug: 'test',
        extra: {
          router: {
            asyncRoutes: false,
          },
        },
      })
    ).toMatchObject({
      extra: {
        router: {
          asyncRoutes: false,
        },
      },
    });
  });
});
