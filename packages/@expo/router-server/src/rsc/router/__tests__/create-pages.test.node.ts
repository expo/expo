import type { FunctionComponent } from 'react';

import { createPages } from '../expo-definedRouter';

const SHOULD_SKIP_ID = '/SHOULD_SKIP';
const LOCATION_ID = '/LOCATION';

const NullComponent: FunctionComponent<any> = () => null;

function build(fn: Parameters<typeof createPages>[0]) {
  return createPages(fn);
}

async function render(
  router: ReturnType<typeof createPages>,
  input: string,
  params?: unknown
) {
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
    const shouldSkip = entries![SHOULD_SKIP_ID] as Array<[string, unknown]>;
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
