describe('head URL helpers', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('expo-constants');
  });

  it('builds static URLs from the configured head origin', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          router: {
            headOrigin: 'https://example.com/app?ignored=true#hash',
          },
        },
      },
    }));

    const { getStaticUrlFromExpoRouter } =
      require('../url') as typeof import('../url');

    expect(getStaticUrlFromExpoRouter('/profile/evan?tab=posts')).toBe(
      'https://example.com/profile/evan?tab=posts'
    );
  });

  it('builds static URLs from the router origin when headOrigin is absent', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          router: {
            origin: 'https://router.example.com/base',
          },
        },
      },
    }));

    const { getStaticUrlFromExpoRouter } =
      require('../url') as typeof import('../url');

    expect(getStaticUrlFromExpoRouter('/profile/evan?tab=posts')).toBe(
      'https://router.example.com/profile/evan?tab=posts'
    );
  });

  it('builds static URLs from the generated origin when explicit origins are absent', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          router: {
            generatedOrigin: 'https://generated.example.com',
          },
        },
      },
    }));

    const { getStaticUrlFromExpoRouter } =
      require('../url') as typeof import('../url');

    expect(getStaticUrlFromExpoRouter('/profile/evan?tab=posts')).toBe(
      'https://generated.example.com/profile/evan?tab=posts'
    );
  });

  it('throws when no origin is configured', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          router: {},
        },
      },
    }));

    const { getStaticUrlFromExpoRouter } =
      require('../url') as typeof import('../url');

    expect(() => getStaticUrlFromExpoRouter('/missing')).toThrow(
      'Expo Head: Add the handoff origin'
    );
  });

  it('throws for unsupported origin protocols', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          router: {
            headOrigin: 'ftp://example.com',
          },
        },
      },
    }));

    const { getStaticUrlFromExpoRouter } =
      require('../url') as typeof import('../url');

    expect(() => getStaticUrlFromExpoRouter('/invalid')).toThrow(
      'Expo Head: Native origin has invalid protocol'
    );
  });
});
