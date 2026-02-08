import { resolveHref, resolveHrefStringWithSegments } from '../href';

describe(resolveHref, () => {
  it(`passes strings back without resolution`, () => {
    [
      '/foobar',
      '/foo/[bar]',
      '/foo/[...bar]',
      '/(somn)/foobar',
      '/(somn)/other/(remove)/foobar',
      'Tot4lly Wr0n9',
    ].forEach((href) => {
      expect(resolveHref(href)).toBe(href);
    });
  });

  it(`adds dynamic query parameters`, () => {
    expect(resolveHref({ pathname: '/[some]', params: { some: 'value' } })).toBe('/value');
    expect(
      resolveHref({
        pathname: '/[some]/cool/[thing]',
        params: { some: 'value' },
      })
    ).toBe('/value/cool/[thing]');
    expect(
      resolveHref({
        pathname: '/[some]/cool/[thing]',
        params: { some: 'alpha', thing: 'beta' },
      })
    ).toBe('/alpha/cool/beta');
  });
  it(`allows nullish query parameters`, () => {
    expect(resolveHref({ pathname: '/alpha', params: { beta: null } })).toBe('/alpha');
    expect(
      resolveHref({
        pathname: '/alpha',
        params: { beta: undefined, three: '1' },
      })
    ).toBe('/alpha?three=1');
  });
  it(`adds query parameters`, () => {
    expect(resolveHref({ pathname: '/alpha', params: { beta: 'value' } })).toBe(
      '/alpha?beta=value'
    );
    expect(
      resolveHref({
        pathname: '/alpha',
        params: { beta: 'value', gamma: 'another' },
      })
    ).toBe('/alpha?beta=value&gamma=another');
    expect(
      resolveHref({
        pathname: '/alpha',
        params: {},
      })
    ).toBe('/alpha');
    expect(
      resolveHref({
        pathname: '/alpha/[beta]',
        params: { beta: 'some', gamma: 'another' },
      })
    ).toBe('/alpha/some?gamma=another');
  });
  it('encodes query parameters', () => {
    expect(resolveHref({ pathname: '/fake/path', params: { value: '++test++' } })).toBe(
      '/fake/path?value=%2B%2Btest%2B%2B'
    );
  });
});

describe(resolveHrefStringWithSegments, () => {
  describe('backwards compatibility', () => {
    it('resolves relative links without new parameters (original behavior)', () => {
      // Standard relative link
      expect(
        resolveHrefStringWithSegments('./profile', {
          segments: ['app', 'home'],
        })
      ).toBe('/app/profile');

      // Parent directory
      expect(
        resolveHrefStringWithSegments('../settings', {
          segments: ['app', 'home'],
        })
      ).toBe('/settings');

      // With relativeToDirectory flag
      expect(
        resolveHrefStringWithSegments(
          './profile',
          { segments: ['app', 'home'] },
          { relativeToDirectory: true }
        )
      ).toBe('/app/home/profile');
    });

    it('passes through absolute links unchanged', () => {
      expect(
        resolveHrefStringWithSegments('/absolute/path', {
          segments: ['app', 'home'],
        })
      ).toBe('/absolute/path');
    });

    it('handles dynamic segments', () => {
      expect(
        resolveHrefStringWithSegments('./profile', {
          segments: ['app', '[id]'],
          params: { id: '123' },
        })
      ).toBe('/app/profile');
    });
  });

  describe('NativeTabs fix', () => {
    it('resolves relative links with isIndex flag (NativeTabs case)', () => {
      // When on an index route in NativeTabs
      expect(
        resolveHrefStringWithSegments('./profile', {
          segments: ['app', 'tabs', 'home'],
          pathname: '/app/tabs/home/index',
          isIndex: true,
        })
      ).toBe('/app/tabs/home/profile');
    });

    it('resolves relative links when pathname ends with /index', () => {
      expect(
        resolveHrefStringWithSegments('./profile', {
          segments: ['app', 'tabs', 'home'],
          pathname: '/app/tabs/home/index',
        })
      ).toBe('/app/tabs/home/profile');
    });

    it('handles case where only isIndex is provided', () => {
      expect(
        resolveHrefStringWithSegments('./profile', {
          segments: ['app', 'tabs', 'home'],
          isIndex: true,
        })
      ).toBe('/app/tabs/home/profile');
    });

    it('handles case where isIndex is false (not an index route)', () => {
      expect(
        resolveHrefStringWithSegments('./other', {
          segments: ['app', 'tabs', 'profile'],
          pathname: '/app/tabs/profile',
          isIndex: false,
        })
      ).toBe('/app/tabs/profile/other');
    });
  });

  describe('edge cases', () => {
    it('handles empty segments', () => {
      expect(
        resolveHrefStringWithSegments('./page', {
          segments: [],
        })
      ).toBe('/page');
    });

    it('handles undefined pathname safely', () => {
      expect(
        resolveHrefStringWithSegments('./page', {
          segments: ['app'],
          pathname: undefined,
        })
      ).toBe('/page');
    });

    it('handles malformed pathname safely', () => {
      expect(
        resolveHrefStringWithSegments('./page', {
          segments: ['app'],
          pathname: '///invalid//path///',
        })
      ).toBe('/page');
    });

    it('prioritizes isIndex when it conflicts with segments', () => {
      // segments don't end with 'index', but isIndex is true
      expect(
        resolveHrefStringWithSegments('./page', {
          segments: ['app', 'profile'],
          isIndex: true,
        })
      ).toBe('/app/profile/page');
    });

    it('handles query strings in relative links', () => {
      expect(
        resolveHrefStringWithSegments('./profile?tab=settings', {
          segments: ['app', 'home'],
          pathname: '/app/home/index',
          isIndex: true,
        })
      ).toBe('/app/home/profile?tab=settings');
    });
  });
});
