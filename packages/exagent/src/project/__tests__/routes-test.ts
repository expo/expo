import { vol } from 'memfs';

import { matchProjectRoute, readProjectRoutesAsync } from '../routes';

const projectRoot = '/project';

function writeProject(files: Record<string, string>) {
  vol.fromJSON({ [`${projectRoot}/package.json`]: '{"name":"app"}', ...files });
}

/** The route strings of a scan, sorted, so a test reads as the URL surface of the project. */
async function routesOf(files: Record<string, string>): Promise<string[]> {
  writeProject(files);
  const table = await readProjectRoutesAsync(projectRoot);
  return table.routes.map((route) => route.route).sort();
}

afterEach(() => {
  vol.reset();
});

describe(readProjectRoutesAsync, () => {
  it(`should read the app directory of a project that has one`, async () => {
    await expect(
      routesOf({
        [`${projectRoot}/app/_layout.tsx`]: '',
        [`${projectRoot}/app/index.tsx`]: '',
        [`${projectRoot}/app/notes.tsx`]: '',
      })
    ).resolves.toEqual(['/', '/_sitemap', '/notes']);
  });

  // `getRouterDirectory` prefers `src/app`, so a project laid out that way must not read as one
  // with no routes at all.
  it(`should prefer src/app over app, the way the router does`, async () => {
    writeProject({
      [`${projectRoot}/src/app/index.tsx`]: '',
      [`${projectRoot}/src/app/notes.tsx`]: '',
    });
    const table = await readProjectRoutesAsync(projectRoot);
    expect(table.routerRoot).toBe('src/app');
    expect(table.routes.map((route) => route.route).sort()).toEqual(['/', '/_sitemap', '/notes']);
  });

  it(`should read the router root the app config names`, async () => {
    writeProject({
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { extra: { router: { root: 'routes' } } },
      }),
      [`${projectRoot}/app/index.tsx`]: '',
      [`${projectRoot}/routes/index.tsx`]: '',
      [`${projectRoot}/routes/settings.tsx`]: '',
    });
    const table = await readProjectRoutesAsync(projectRoot);
    expect(table.routerRoot).toBe('routes');
    expect(table.routes.map((route) => route.route).sort()).toEqual([
      '/',
      '/_sitemap',
      '/settings',
    ]);
  });

  it(`should read the root out of the expo-router plugin options`, async () => {
    writeProject({
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { plugins: [['expo-router', { root: 'routes' }]] },
      }),
      [`${projectRoot}/routes/index.tsx`]: '',
    });
    await expect(readProjectRoutesAsync(projectRoot)).resolves.toMatchObject({
      routerRoot: 'routes',
    });
  });

  it(`should strip group segments from the URL, and keep the file`, async () => {
    writeProject({
      [`${projectRoot}/app/(tabs)/_layout.tsx`]: '',
      [`${projectRoot}/app/(tabs)/index.tsx`]: '',
      [`${projectRoot}/app/(tabs)/explore.tsx`]: '',
    });
    const table = await readProjectRoutesAsync(projectRoot);
    expect(table.routes.map((route) => route.route).sort()).toEqual(['/', '/_sitemap', '/explore']);
    expect(table.routes.find((route) => route.route === '/explore')?.file).toBe(
      'app/(tabs)/explore.tsx'
    );
  });

  it(`should keep dynamic segments as written`, async () => {
    await expect(
      routesOf({
        [`${projectRoot}/app/users/[id].tsx`]: '',
        [`${projectRoot}/app/blog/[...slug].tsx`]: '',
      })
    ).resolves.toEqual(['/_sitemap', '/blog/[...slug]', '/users/[id]']);
  });

  it(`should mark which routes have a dynamic segment`, async () => {
    writeProject({
      [`${projectRoot}/app/index.tsx`]: '',
      [`${projectRoot}/app/users/[id].tsx`]: '',
    });
    const table = await readProjectRoutesAsync(projectRoot);
    expect(table.routes.find((route) => route.route === '/users/[id]')?.dynamic).toBe(true);
    expect(table.routes.find((route) => route.route === '/')?.dynamic).toBe(false);
  });

  // Everything the router treats as machinery rather than as a screen. `+not-found` is the screen
  // an unmatched route already lands on, so listing it as a destination would say that every route
  // resolves.
  it(`should leave layouts, API routes and the + conventions out`, async () => {
    await expect(
      routesOf({
        [`${projectRoot}/app/_layout.tsx`]: '',
        [`${projectRoot}/app/+html.tsx`]: '',
        [`${projectRoot}/app/+not-found.tsx`]: '',
        [`${projectRoot}/app/+native-intent.ts`]: '',
        [`${projectRoot}/app/+middleware.ts`]: '',
        [`${projectRoot}/app/api/hello+api.ts`]: '',
        [`${projectRoot}/app/notes.tsx`]: '',
      })
    ).resolves.toEqual(['/_sitemap', '/notes']);
  });

  it(`should collapse the platform extensions onto one route`, async () => {
    await expect(
      routesOf({
        [`${projectRoot}/app/settings.ios.tsx`]: '',
        [`${projectRoot}/app/settings.android.tsx`]: '',
        [`${projectRoot}/app/settings.web.tsx`]: '',
      })
    ).resolves.toEqual(['/_sitemap', '/settings']);
  });

  it(`should ignore files that are not modules`, async () => {
    await expect(
      routesOf({
        [`${projectRoot}/app/index.tsx`]: '',
        [`${projectRoot}/app/styles.css`]: '',
        [`${projectRoot}/app/readme.md`]: '',
      })
    ).resolves.toEqual(['/', '/_sitemap']);
  });

  // A project with no router directory is not a project with no routes: nothing was read, so
  // nothing can be judged. The caller reports it as unchecked rather than as a failure.
  it(`should report no router root for a project that has none`, async () => {
    writeProject({ [`${projectRoot}/index.js`]: '' });
    await expect(readProjectRoutesAsync(projectRoot)).resolves.toEqual({
      routerRoot: null,
      routes: [],
      reason: 'this project has no app directory, so it does not use Expo Router',
    });
  });

  it(`should report a router root that holds no route files`, async () => {
    writeProject({ [`${projectRoot}/app/_layout.tsx`]: '' });
    const table = await readProjectRoutesAsync(projectRoot);
    expect(table.routes).toEqual([]);
    expect(table.reason).toBe('the app directory holds no route files');
  });
});

describe(matchProjectRoute, () => {
  const table = (routes: string[]) =>
    routes.map((route) => ({ route, file: `app${route}.tsx`, dynamic: /\[/.test(route) }));

  it(`should match a literal route`, () => {
    expect(matchProjectRoute(table(['/', '/notes']), '/notes')).toEqual({
      ok: true,
      matched: '/notes',
    });
  });

  it(`should match the root route`, () => {
    expect(matchProjectRoute(table(['/', '/notes']), '/')).toEqual({ ok: true, matched: '/' });
    expect(matchProjectRoute(table(['/', '/notes']), '')).toEqual({ ok: true, matched: '/' });
  });

  it(`should reject a route the project has not got`, () => {
    expect(matchProjectRoute(table(['/', '/notes']), '/nope')).toEqual({
      ok: false,
      matched: null,
    });
  });

  // The whole point of matching patterns rather than strings: `/users/42` is a route this project
  // has, and no literal comparison can say so.
  it(`should match a value against a dynamic segment`, () => {
    expect(matchProjectRoute(table(['/users/[id]']), '/users/42')).toEqual({
      ok: true,
      matched: '/users/[id]',
    });
  });

  it(`should not let a dynamic segment swallow a slash`, () => {
    expect(matchProjectRoute(table(['/users/[id]']), '/users/42/edit')).toEqual({
      ok: false,
      matched: null,
    });
  });

  it(`should match many segments against a catch-all`, () => {
    expect(matchProjectRoute(table(['/blog/[...slug]']), '/blog/2026/08/hello')).toEqual({
      ok: true,
      matched: '/blog/[...slug]',
    });
  });

  it(`should match the route as written, dynamic segment and all`, () => {
    expect(matchProjectRoute(table(['/users/[id]']), '/users/[id]')).toEqual({
      ok: true,
      matched: '/users/[id]',
    });
  });

  it(`should prefer the literal route over a dynamic one that also matches`, () => {
    expect(matchProjectRoute(table(['/users/[id]', '/users/me']), '/users/me')).toEqual({
      ok: true,
      matched: '/users/me',
    });
  });

  it(`should ignore a query string and a fragment`, () => {
    expect(matchProjectRoute(table(['/search']), '/search?q=shoes')).toEqual({
      ok: true,
      matched: '/search',
    });
    expect(matchProjectRoute(table(['/search']), '/search#top')).toEqual({
      ok: true,
      matched: '/search',
    });
  });

  it(`should ignore a trailing slash`, () => {
    expect(matchProjectRoute(table(['/notes']), '/notes/')).toEqual({
      ok: true,
      matched: '/notes',
    });
  });

  // A group is addressable even though the canonical route drops it, so both spellings resolve.
  it(`should accept the group-inclusive spelling of a route`, () => {
    expect(matchProjectRoute(table(['/explore']), '/(tabs)/explore')).toEqual({
      ok: true,
      matched: '/explore',
    });
  });

  it(`should decode a percent-encoded segment before matching`, () => {
    expect(matchProjectRoute(table(['/a b']), '/a%20b')).toEqual({ ok: true, matched: '/a b' });
  });
});
