import withRouter from '../withRouter';

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
