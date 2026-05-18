import type { NavigationRoute } from '~/types/common';

import { getBreadcrumbTrail, isReferencePath } from './routes';

describe(isReferencePath, () => {
  it('returns true for unversioned pathname', () => {
    expect(isReferencePath('/versions/unversioned')).toBe(true);
  });

  it('returns true for sdk pathname', () => {
    expect(isReferencePath('/versions/latest/sdk/notifications')).toBe(true);
  });

  it('returns true for react-native pathname', () => {
    expect(isReferencePath('/versions/v44.0.0/react-native/stylesheet/')).toBe(true);
  });

  it('returns false for non-versioned pathname', () => {
    expect(isReferencePath('/build-reference/how-tos/')).toBe(false);
  });
});

describe(getBreadcrumbTrail, () => {
  const mockRoutes: NavigationRoute[] = [
    {
      type: 'section',
      name: 'Develop',
      href: '',
      children: [
        { type: 'page', name: 'Tools', href: '/develop/tools' },
        {
          type: 'group',
          name: 'User interface',
          href: '',
          children: [
            { type: 'page', name: 'Fonts', href: '/develop/user-interface/fonts' },
            { type: 'page', name: 'Assets', href: '/develop/user-interface/assets' },
          ],
        },
      ],
    },
    {
      type: 'section',
      name: 'Deploy',
      href: '',
      children: [{ type: 'page', name: 'Build project', href: '/deploy/build-project' }],
    },
  ];

  it('returns empty array for pathname not in routes', () => {
    expect(getBreadcrumbTrail(mockRoutes, '/nonexistent')).toEqual([]);
  });

  it('returns 2-item trail for page directly under a section', () => {
    const trail = getBreadcrumbTrail(mockRoutes, '/develop/tools');

    expect(trail).toEqual([{ name: 'Develop', url: 'https://docs.expo.dev' }, { name: 'Tools' }]);
  });

  it('returns 3-item trail for page nested in a group', () => {
    const trail = getBreadcrumbTrail(mockRoutes, '/develop/user-interface/fonts');

    expect(trail).toEqual([
      { name: 'Develop', url: 'https://docs.expo.dev' },
      { name: 'User interface', url: 'https://docs.expo.dev' },
      { name: 'Fonts' },
    ]);
  });

  it('last item has no url', () => {
    const trail = getBreadcrumbTrail(mockRoutes, '/deploy/build-project');

    expect(trail.at(-1)).toEqual({ name: 'Build project' });
    expect(trail.at(-1)).not.toHaveProperty('url');
  });

  it('uses sidebarTitle over name when available', () => {
    const routes: NavigationRoute[] = [
      {
        type: 'section',
        name: 'Section',
        href: '',
        children: [
          {
            type: 'page',
            name: 'Long Page Name',
            sidebarTitle: 'Short',
            href: '/section/page',
          },
        ],
      },
    ];

    const trail = getBreadcrumbTrail(routes, '/section/page');
    expect(trail.at(-1)!.name).toBe('Short');
  });

  it('skips hidden nodes', () => {
    const routes: NavigationRoute[] = [
      {
        type: 'section',
        name: 'Section',
        href: '',
        children: [
          { type: 'page', name: 'Hidden', href: '/section/hidden', hidden: true },
          { type: 'page', name: 'Visible', href: '/section/visible' },
        ],
      },
    ];

    expect(getBreadcrumbTrail(routes, '/section/hidden')).toEqual([]);
    expect(getBreadcrumbTrail(routes, '/section/visible')).toHaveLength(2);
  });

  it('skips null entries in route arrays', () => {
    const routes = [
      null,
      {
        type: 'section',
        name: 'Section',
        href: '',
        children: [{ type: 'page', name: 'Page', href: '/section/page' }],
      },
    ] as unknown as NavigationRoute[];

    const trail = getBreadcrumbTrail(routes, '/section/page');
    expect(trail).toEqual([{ name: 'Section', url: 'https://docs.expo.dev' }, { name: 'Page' }]);
  });

  it('filters out empty-name ancestors', () => {
    const routes: NavigationRoute[] = [
      {
        type: 'section',
        name: '',
        href: '',
        children: [{ type: 'page', name: 'Overview', href: '/overview' }],
      },
    ];

    const trail = getBreadcrumbTrail(routes, '/overview');
    expect(trail).toEqual([{ name: 'Overview' }]);
  });

  it('falls back to docs root for sections without an index page', () => {
    const routes: NavigationRoute[] = [
      {
        type: 'section',
        name: 'App signing',
        href: '',
        children: [{ type: 'page', name: 'App credentials', href: '/app-signing/app-credentials' }],
      },
    ];

    const trail = getBreadcrumbTrail(routes, '/app-signing/app-credentials');
    expect(trail[0]).toEqual({
      name: 'App signing',
      url: 'https://docs.expo.dev',
    });
  });

  it('uses href directly for index page when deriving ancestor URL', () => {
    const routes: NavigationRoute[] = [
      {
        type: 'section',
        name: 'EAS',
        href: '',
        children: [
          {
            type: 'group',
            name: 'Environment variables',
            href: '',
            children: [
              {
                type: 'page',
                name: 'Overview',
                href: '/eas/environment-variables',
                isIndex: true,
              },
              { type: 'page', name: 'Manage', href: '/eas/environment-variables/manage' },
            ],
          },
        ],
      },
    ];

    const trail = getBreadcrumbTrail(routes, '/eas/environment-variables/manage');
    expect(trail[1]).toEqual({
      name: 'Environment variables',
      url: 'https://docs.expo.dev/eas/environment-variables',
    });
  });
});
