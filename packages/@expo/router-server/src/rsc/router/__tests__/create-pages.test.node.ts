import type { FunctionComponent } from 'react';

import { createPages } from '../createPages';

const SHOULD_SKIP_ID = '/SHOULD_SKIP';
const LOCATION_ID = '/LOCATION';

const NullComponent: FunctionComponent<any> = () => null;

function build(fn: Parameters<typeof createPages>[0]) {
  return createPages(fn);
}

async function render(router: ReturnType<typeof createPages>, input: string, params?: unknown) {
  return router.renderEntries(input, {
    params: params == null ? undefined : JSON.stringify(params),
    buildConfig: undefined,
  });
}

describe('createPages', () => {
  it('resolves static page IDs alongside layouts', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'about');

    expect(entries).not.toBeNull();
    expect(Object.keys(entries!).sort()).toEqual(
      [LOCATION_ID, SHOULD_SKIP_ID, 'about/page', 'layout'].sort()
    );
  });

  it('resolves slug-based dynamic page IDs', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/posts/[id]' as any, render: 'dynamic' });
    });

    const entries = await render(router, 'posts/123');

    expect(entries).not.toBeNull();
    expect(entries).toHaveProperty('posts/123/page');
    expect(entries).toHaveProperty('layout');
  });

  it('resolves wildcard page IDs', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({
        component: NullComponent,
        path: '/blog/[...slug]' as any,
        render: 'dynamic',
      });
    });

    const entries = await render(router, 'blog/a/b/c');

    expect(entries).not.toBeNull();
    expect(entries).toHaveProperty('blog/a/b/c/page');
  });

  it('returns null for an unknown path', async () => {
    const router = build(async ({ createPage }) => {
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'unknown');

    expect(entries).toBeNull();
  });

  it('opts only pages (not layouts) into shouldSkipObj', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'about');
    const shouldSkip = entries![SHOULD_SKIP_ID] as [string, unknown][];
    const optedInIds = new Set(shouldSkip.map(([id]) => id));

    expect(optedInIds.has('about/page')).toBe(true);
    expect(optedInIds.has('layout')).toBe(false);
  });

  it('drops a page from the response when the client skips an opted-in entry', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'about', { skip: ['about/page'] });

    expect(entries).not.toHaveProperty('about/page');
    expect(entries).toHaveProperty('layout');
  });

  it('refuses to skip a layout even when the client requests it', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'about', { skip: ['layout'] });

    expect(entries).toHaveProperty('layout');
    expect(entries).toHaveProperty('about/page');
  });

  it('matches static pages under group segments', async () => {
    // Expo Router uses `(group)` segments for filesystem organization; they
    // do not appear in runtime URLs. The matcher must treat them as optional
    // so a page at `/(auth)/login` resolves for URL `/login`.
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({
        component: NullComponent,
        path: '/(auth)/login' as any,
        render: 'static',
      });
    });

    const entries = await render(router, 'login');
    expect(entries).not.toBeNull();
    expect(entries).toHaveProperty('login/page');
  });

  it('prefers non-wildcard pages over wildcard pages when both could match', async () => {
    const NonWildcardPage: FunctionComponent<any> = () => null;
    const WildcardPage: FunctionComponent<any> = () => null;

    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      // Register wildcard FIRST so registration order can't accidentally satisfy the test.
      createPage({
        component: WildcardPage,
        path: '/posts/[...rest]' as any,
        render: 'dynamic',
      });
      createPage({
        component: NonWildcardPage,
        path: '/posts/[id]' as any,
        render: 'dynamic',
      });
    });

    const entries = await render(router, 'posts/123');
    expect(entries).not.toBeNull();
    expect(entries).toHaveProperty('posts/123/page');

    const pageElement = entries!['posts/123/page'] as { type: FunctionComponent };
    // The matched component should be the non-wildcard page (single segment) even though
    // the wildcard would also match.
    expect(pageElement.type.name).toBe('WrappedComponent');
  });

  it('renders a root page registered with empty path', async () => {
    // Regression: top-level `./index.tsx` gets registered with path `''` after
    // `getContextKey(...).replace(/\/index$/, '')`. The resolver and getBuildConfig
    // must both handle this without throwing.
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '' as any, render: 'static' });
    });

    const entries = await render(router, '');
    expect(entries).not.toBeNull();
    expect(entries).toHaveProperty('page');
    expect(entries).toHaveProperty('layout');
  });

  it('produces a buildConfig entry for a root page', async () => {
    // Regression: getInputString rejects paths that don't start with `/`. A root
    // page must surface with pathname `/` in buildConfig, not the raw `''`.
    const router = build(async ({ createPage }) => {
      createPage({ component: NullComponent, path: '' as any, render: 'static' });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const root = buildConfig.find(({ pathname }) => pathname === '/');
    expect(root).toBeDefined();
    expect(root!.entries).toEqual([{ input: '', isStatic: true }]);
  });

  it('produces a buildConfig entry for a literal static page', async () => {
    const router = build(async ({ createPage }) => {
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const about = buildConfig.find(({ pathname }) => pathname === '/about');
    expect(about).toBeDefined();
    expect(about!.isStatic).toBe(true);
    expect(about!.entries).toEqual([{ input: 'about', isStatic: true }]);
  });

  it('marks dynamic pages as non-static in buildConfig and skips their entries', async () => {
    const router = build(async ({ createPage }) => {
      createPage({ component: NullComponent, path: '/posts/[id]' as any, render: 'dynamic' });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const posts = buildConfig.find(({ pathname }) => pathname.includes('['));
    expect(posts).toBeDefined();
    expect(posts!.isStatic).toBe(false);
    // No `entries[]` for dynamic paths — they can't be pre-rendered.
    expect(posts!.entries).toEqual([]);
  });

  it('expands staticPaths into one buildConfig entry per concrete path', async () => {
    const router = build(async ({ createPage }) => {
      createPage({
        component: NullComponent,
        path: '/posts/[id]' as any,
        render: 'static',
        staticPaths: [['a'], ['b'], ['c']],
      });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const concretePaths = buildConfig
      .map(({ pathname }) => pathname)
      .filter((p) => p.startsWith('/posts/'))
      .sort();
    expect(concretePaths).toEqual(['/posts/a', '/posts/b', '/posts/c']);
  });

  it('marks pages under a dynamic layout as non-static', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({
        component: NullComponent,
        path: '/dashboard' as any,
        render: 'dynamic',
      });
      createPage({
        component: NullComponent,
        path: '/dashboard/about' as any,
        render: 'static',
      });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const about = buildConfig.find(({ pathname }) => pathname === '/dashboard/about');
    expect(about).toBeDefined();
    expect(about!.isStatic).toBe(false);
  });

  it('propagates unstable_disableSSR onto buildConfig as customData.noSsr', async () => {
    const router = build(async ({ createPage }) => {
      createPage({
        component: NullComponent,
        path: '/private' as any,
        render: 'static',
        unstable_disableSSR: true,
      });
    });

    const buildConfig = await router.getBuildConfig!(async () => []);
    const priv = buildConfig.find(({ pathname }) => pathname === '/private');
    expect(priv!.customData).toMatchObject({ noSsr: true });
  });

  it('throws on duplicate components for the same path+kind', async () => {
    const ComponentA: FunctionComponent<any> = () => null;
    const ComponentB: FunctionComponent<any> = () => null;
    const router = build(async ({ createPage }) => {
      createPage({ component: ComponentA, path: '/about' as any, render: 'static' });
      createPage({ component: ComponentB, path: '/about' as any, render: 'static' });
    });

    await expect(render(router, 'about')).rejects.toThrow(/Duplicated/);
  });

  it('ignores non-string skip entries without crashing', async () => {
    const router = build(async ({ createPage, createLayout }) => {
      createLayout({ component: NullComponent, path: '' as any, render: 'static' });
      createPage({ component: NullComponent, path: '/about' as any, render: 'static' });
    });

    const entries = await render(router, 'about', {
      skip: [42, null, { malicious: true }, 'about/page'],
    });

    expect(entries).not.toHaveProperty('about/page');
    expect(entries).toHaveProperty('layout');
  });
});
