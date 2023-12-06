import {
  extrapolateGroupRoutes,
  CATCH_ALL,
  SLUG,
  CAPTURE_DYNAMIC_PARAMS,
  CAPTURE_GROUP_REGEX,
  ARRAY_GROUP_REGEX,
  getTypedRoutesUtils,
  TYPED_ROUTES_EXCLUSION_REGEX,
} from '../routes';

describe(`${CAPTURE_DYNAMIC_PARAMS}`, () => {
  it('can match dynamic route params', () => {
    // Matches is a RegexMatchArray[]
    const matches = [...'/test/[...param1]/[param2]/[param3]'.matchAll(CAPTURE_DYNAMIC_PARAMS)];

    // Need to convert RegexMatchArray to an array to easily compare
    expect([...matches[0]]).toStrictEqual(['[...param1]', 'param1']);
    expect([...matches[1]]).toStrictEqual(['[param2]', 'param2']);
    expect([...matches[2]]).toStrictEqual(['[param3]', 'param3']);
  });
});

describe(`${CATCH_ALL}`, () => {
  it('can match catch all params', () => {
    // Matches is a RegexMatchArray[]
    const matches = [...'/test/[...param1]/[param2]/[param3]'.matchAll(CATCH_ALL)];

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(1);
    expect([...matches[0]]).toStrictEqual(['[...param1]']);
  });
});

describe(`${SLUG}`, () => {
  it('can match slug params', () => {
    // Matches is a RegexMatchArray[]
    const matches = [...'/test/[...param1]/[param2]/[param3]'.matchAll(SLUG)];

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(3);
    expect([...matches[0]]).toStrictEqual(['[...param1]']);
    expect([...matches[1]]).toStrictEqual(['[param2]']);
    expect([...matches[2]]).toStrictEqual(['[param3]']);
  });
});

describe(`${ARRAY_GROUP_REGEX}`, () => {
  it('can match slug params', () => {
    // Matches is a RegexMatchArray[]
    const matches = Array.from(
      '/(a,b,c)/test/(d,e)/(  my group, my other group )/(f)'.matchAll(ARRAY_GROUP_REGEX)
    );

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(3);
    expect([...matches[0]]).toStrictEqual(['(a,b,c)']);
    expect([...matches[1]]).toStrictEqual(['(d,e)']);
    expect([...matches[2]]).toStrictEqual(['(  my group, my other group )']);
    // (f) is ignored as it is not an array group
  });
});

describe(`${CAPTURE_GROUP_REGEX}`, () => {
  it('can all in a group', () => {
    // Matches is a RegexMatchArray[]
    const matches = [...'/(group1,group2,group3)/test'.matchAll(CAPTURE_GROUP_REGEX)];

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(3);
    expect([...matches[0]]).toStrictEqual(['(group1', 'group1']);
    expect([...matches[1]]).toStrictEqual([',group2', 'group2']);
    expect([...matches[2]]).toStrictEqual([',group3', 'group3']);
  });

  it('trims the name, but preserves spaces within names', () => {
    const matches = [
      ...'/(   group1  , my group, my other   group  )/my page'.matchAll(CAPTURE_GROUP_REGEX),
    ];

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(3);
    expect([...matches[0]]).toStrictEqual(['(   group1  ', 'group1']);
    expect([...matches[1]]).toStrictEqual([', my group', 'my group']);
    expect([...matches[2]]).toStrictEqual([', my other   group  ', 'my other   group']);
  });
});

describe(`${TYPED_ROUTES_EXCLUSION_REGEX}`, () => {
  it('will not match standard routes', () => {
    expect('/route.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
    expect('/route.js'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
    expect('/route.jsx'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
    expect('/route.tsx'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();

    expect('/folder/html.tsx'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
    expect('/folder/api.tsx'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
    expect('/folder/layout.tsx'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeNull();
  });

  it('will match _layout files', () => {
    expect('_layout.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/_layout.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/route/_layout.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
  });

  it('will match +html files', () => {
    expect('+html.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/+html.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/route/+html.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
  });

  it('will match API routes', () => {
    expect('route+api.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/route+api.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/folder/route+api.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
  });

  it('will match any +filename', () => {
    expect('route+anything.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/route+anything.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/folder/route+anything.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
  });

  it('will match +not+found', () => {
    expect('+not+found.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
    expect('/folder/+not+found.ts'.match(TYPED_ROUTES_EXCLUSION_REGEX)).toBeTruthy();
  });
});

describe(getTypedRoutesUtils, () => {
  const { staticRoutes, dynamicRoutes, filePathToRoute, addFilePath, isRouteFile } =
    getTypedRoutesUtils('/user/project/app');

  describe(isRouteFile, () => {
    const filepaths = [
      ['/user/project/app/file.tsx', true],
      ['/user/project/app/folder/index.tsx', true],
      ['/user/project/other/file.tsx', false],
      ['/user/project/other/app/file.tsx', false],
      ['/user/project/other/app/_layout.tsx', false],
      ['/user/project/app/_layout.tsx', false],
      ['/user/project/app/+html.tsx', false],
      ['/user/project/app/folder/+html.tsx', false],
      ['/user/project/app/folder/_layout.tsx', false],
    ] as const;

    it.each(filepaths)('is within the app root: %s', (filepath, expected) => {
      expect(isRouteFile(filepath)).toEqual(expected);
    });
  });

  describe(filePathToRoute, () => {
    describe('unix paths', () => {
      const filepaths = [
        ['/user/project/app/file.tsx', '/file'],
        ['/user/project/app/file2.jsx', '/file2'],
        ['/user/project/app/folder/index.tsx', '/folder/'],
        ['/user/project/app/folder/(group)/[param].tsx', '/folder/(group)/[param]'],
      ];

      it.each(filepaths)('normalizes a filepath: %s', (filepath, route) => {
        expect(filePathToRoute(filepath)).toEqual(route);
      });
    });

    describe('windows paths', () => {
      const windowsUtils = getTypedRoutesUtils('C:\\user\\project with space\\app', '\\');

      const filepaths = [
        ['C:\\user\\project with space\\app\\file.tsx', '/file'],
        ['C:\\user\\project with space\\app\\file2.jsx', '/file2'],
        ['C:\\user\\project with space\\app\\folder\\index.tsx', '/folder/'],
        [
          'C:\\user\\project with space\\app\\folder\\(group)\\[param].tsx',
          '/folder/(group)/[param]',
        ],
      ];

      it.each(filepaths)('normalizes a windows filepath: %s', (filepath, route) => {
        expect(windowsUtils.filePathToRoute(filepath)).toEqual(route);
      });
    });
  });

  /*
   * addFilePath converts a filepath into routes. One file path may be
   * multiple static or dynamic routes
   *
   * Additionally, the function returns a value if the filepath was processed or skipped
   *
   */
  describe(addFilePath, () => {
    afterEach(() => {
      staticRoutes.clear();
      dynamicRoutes.clear();
    });

    const filepaths = [
      ['/user/project/app/file.tsx', { static: ['/file'] }],
      ['/user/project/app/folder/[slug].tsx', { dynamic: ['/folder/${SingleRoutePart<T>}'] }],
      ['/user/project/app/folder/[...slug].tsx', { dynamic: ['/folder/${CatchAllRoutePart<T>}'] }],
      [
        '/user/project/app/folder/[slug]/[...slug2].tsx',
        { dynamic: ['/folder/${SingleRoutePart<T>}/${CatchAllRoutePart<T>}'] },
      ],
      ['/user/project/app/(group)/page.tsx', { static: ['/(group)/page', '/page'] }],
      [
        '/user/project/app/(group1,group2)/page.tsx',
        { static: ['/(group1)/page', '/(group2)/page', '/page'] },
      ],
      [
        '/user/project/app/(group)/[slug].tsx',
        { dynamic: ['/${SingleRoutePart<T>}', '/(group)/${SingleRoutePart<T>}'] },
      ],
      [
        '/user/project/app/(group)/[...slug].tsx',
        { dynamic: ['/${CatchAllRoutePart<T>}', '/(group)/${CatchAllRoutePart<T>}'] },
      ],
      [
        '/user/project/app/(a,b,c)/(d,e)/page.tsx',
        {
          static: [
            '/page',
            '/(a)/page',
            '/(a)/(d)/page',
            '/(a)/(e)/page',
            '/(b)/page',
            '/(b)/(d)/page',
            '/(b)/(e)/page',
            '/(c)/page',
            '/(c)/(d)/page',
            '/(c)/(e)/page',
          ],
        },
      ],
      [
        '/user/project/app/(   group1  , group2    )/page.tsx',
        { static: ['/(group1)/page', '/(group2)/page', '/page'] },
      ],
      [
        '/user/project/app/(   group1  , my group    )/my page.tsx',
        { static: ['/(group1)/my page', '/(my group)/my page', '/my page'] },
      ],
      ['/user/project/app/folder/_layout.tsx', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/_layout.tsx', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/folder/+html.tsx', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/+html.tsx', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/folder/_layout.js', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/_layout.js', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/folder/+html.js', { static: [], dynamicRoutes: [] }],
      ['/user/project/app/+html.js', { static: [], dynamicRoutes: [] }],
    ] as const;

    it.each(filepaths)('normalizes the filepath: %s', (filepath, expectedRoutes) => {
      addFilePath(filepath);

      if ('static' in expectedRoutes) {
        const actualRoutes = staticRoutes.get(filePathToRoute(filepath));

        for (const staticRoute of expectedRoutes.static) {
          expect(actualRoutes).toContain(staticRoute);
        }
      } else {
        expect(staticRoutes.get(filePathToRoute(filepath))).toBeUndefined();
      }

      if ('dynamic' in expectedRoutes) {
        const actualRoutes = dynamicRoutes.get(filePathToRoute(filepath));

        for (const dynamicRoute of expectedRoutes.dynamic) {
          expect(actualRoutes).toContain(dynamicRoute);
        }
        expect(actualRoutes?.size).toEqual(expectedRoutes.dynamic.length);
      } else {
        expect(dynamicRoutes.get(filePathToRoute(filepath))).toBeUndefined();
      }
    });
  });
});

describe(extrapolateGroupRoutes, () => {
  it('can extrapolate groups', () => {
    expect(extrapolateGroupRoutes('/test/(group1,group2,group3)')).toEqual(
      new Set(['/test', '/test/(group1)', '/test/(group2)', '/test/(group3)'])
    );
  });

  it('can deeply extrapolate groups', () => {
    expect(extrapolateGroupRoutes('/test/(group1,group2,group3)/(test1,test2)')).toEqual(
      new Set([
        '/test',
        '/test/(group1)',
        '/test/(group1)/(test1)',
        '/test/(group1)/(test2)',
        '/test/(group2)',
        '/test/(group2)/(test1)',
        '/test/(group2)/(test2)',
        '/test/(group3)',
        '/test/(group3)/(test1)',
        '/test/(group3)/(test2)',
      ])
    );
  });
});
