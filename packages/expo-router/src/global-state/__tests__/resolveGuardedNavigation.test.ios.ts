import { resolveGuardedNavigation } from '../resolveGuardedNavigation';

describe(resolveGuardedNavigation, () => {
  it('allows a route that no navigator guards', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'home' } },
      href: '/home',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'home' }] } }] },
      registry: new Map([['root-nav', { reduce: () => null, getGuard: () => undefined }]]),
    });

    expect(result).toEqual({ status: 'allowed' });
  });

  it('blocks a guarded route without redirectTo', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) => (routeName === 'secret' ? {} : undefined),
          },
        ],
      ]),
    });

    expect(result).toEqual({ status: 'blocked' });
  });

  it('redirects a guarded route to its redirectTo', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: '/login' } : undefined,
          },
        ],
      ]),
    });

    expect(result).toMatchObject({
      status: 'redirect',
      href: '/login',
      redirect: {
        chain: [{ href: '/secret', route: '[["secret"],{}]' }],
        from: { pathname: '/secret', segments: ['secret'] },
      },
    });
  });

  it('uses the redirectTo of the outermost navigator that guards the route', () => {
    const result = resolveGuardedNavigation({
      action: {
        type: 'NAVIGATE',
        target: 'root-nav',
        payload: { name: 'app', state: { key: 'app-nav', routes: [{ name: 'secret' }] } },
      },
      href: '/secret',
      targetState: {
        routes: [
          {
            name: '__root',
            state: { routes: [{ name: 'app', state: { routes: [{ name: 'secret' }] } }] },
          },
        ],
      },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'app' ? { redirectTo: '/outer-login' } : undefined,
          },
        ],
        [
          'app-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: '/inner-login' } : undefined,
          },
        ],
      ]),
    });

    expect(result).toMatchObject({ status: 'redirect', href: '/outer-login' });
  });

  it('allows a guarded route whose redirectTo is an external URL', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: 'https://expo.dev' } : undefined,
          },
        ],
      ]),
    });

    expect(result).toEqual({ status: 'allowed' });
  });

  it('reports a loop when a redirect reaches a route that was already blocked', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: '/login' } : undefined,
          },
        ],
      ]),
      redirect: {
        chain: [
          { href: '/secret', route: '[["secret"],{}]' },
          { href: '/login', route: '[["login"],{}]' },
        ],
        from: {
          unstable_globalHref: '/login',
          pathname: '/login',
          params: {},
          searchParams: new URLSearchParams(),
          segments: ['login'],
          pathnameWithParams: '/login',
          isIndex: false,
        },
      },
    });

    expect(result).toEqual({
      status: 'redirect-loop',
      hrefs: ['/secret', '/login', '/secret'],
    });
  });

  it('redirects when the redirect chain is exactly 20 routes long', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: '/login' } : undefined,
          },
        ],
      ]),
      redirect: {
        chain: Array.from({ length: 19 }, (_, step) => ({
          href: `/step-${step}`,
          route: `[["step-${step}"],{}]`,
        })),
        from: {
          unstable_globalHref: '/step-18',
          pathname: '/step-18',
          params: {},
          searchParams: new URLSearchParams(),
          segments: ['step-18'],
          pathnameWithParams: '/step-18',
          isIndex: false,
        },
      },
    });

    expect(result).toMatchObject({ status: 'redirect', href: '/login' });
  });

  it('reports a loop when the redirect chain is longer than 20 routes', () => {
    const result = resolveGuardedNavigation({
      action: { type: 'NAVIGATE', target: 'root-nav', payload: { name: 'secret' } },
      href: '/secret',
      targetState: { routes: [{ name: '__root', state: { routes: [{ name: 'secret' }] } }] },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) =>
              routeName === 'secret' ? { redirectTo: '/login' } : undefined,
          },
        ],
      ]),
      redirect: {
        chain: Array.from({ length: 20 }, (_, step) => ({
          href: `/step-${step}`,
          route: `[["step-${step}"],{}]`,
        })),
        from: {
          unstable_globalHref: '/step-19',
          pathname: '/step-19',
          params: {},
          searchParams: new URLSearchParams(),
          segments: ['step-19'],
          pathnameWithParams: '/step-19',
          isIndex: false,
        },
      },
    });

    expect(result).toEqual({
      status: 'redirect-loop',
      hrefs: [
        '/step-0',
        '/step-1',
        '/step-2',
        '/step-3',
        '/step-4',
        '/step-5',
        '/step-6',
        '/step-7',
        '/step-8',
        '/step-9',
        '/step-10',
        '/step-11',
        '/step-12',
        '/step-13',
        '/step-14',
        '/step-15',
        '/step-16',
        '/step-17',
        '/step-18',
        '/step-19',
        '/secret',
      ],
    });
  });

  it('does not check routes of a navigator that is not mounted', () => {
    const result = resolveGuardedNavigation({
      action: {
        type: 'NAVIGATE',
        target: 'root-nav',
        // A navigator that is not mounted has no state key yet.
        payload: { name: 'app', state: { routes: [{ name: 'secret' }] } },
      },
      href: '/secret',
      targetState: {
        routes: [
          {
            name: '__root',
            state: { routes: [{ name: 'app', state: { routes: [{ name: 'secret' }] } }] },
          },
        ],
      },
      registry: new Map([
        [
          'root-nav',
          {
            reduce: () => null,
            getGuard: (routeName: string) => (routeName === 'secret' ? {} : undefined),
          },
        ],
      ]),
    });

    expect(result).toEqual({ status: 'allowed' });
  });
});
