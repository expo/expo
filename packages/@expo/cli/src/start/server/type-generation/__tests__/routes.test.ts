import {
  extrapolateGroupRoutes,
  CATCH_ALL,
  SLUG,
  CAPTURE_DYNAMIC_PARAMS,
  CAPTURE_GROUP_REGEX,
  ARRAY_GROUP_REGEX,
  getTypedRoutesUtils,
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
    const matches = [...'/(a,b,c)/test/(d,e)/(f)'.matchAll(ARRAY_GROUP_REGEX)];

    // Need to convert RegexMatchArray to an array to easily compare
    expect(matches).toHaveLength(2);
    expect([...matches[0]]).toStrictEqual(['(a,b,c)']);
    expect([...matches[1]]).toStrictEqual(['(d,e)']);
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
});

describe(getTypedRoutesUtils, () => {
  const { staticRoutes, dynamicRoutes, filePathToRoute, addFilePath } = getTypedRoutesUtils('/app');

  describe(filePathToRoute, () => {
    const filepaths = [
      ['/app/file.tsx', '/file'],
      ['/app/file2.jsx', '/file2'],
      ['/app/folder/index.tsx', '/folder/'],
      ['/app/folder/(group)/[param].tsx', '/folder/(group)/[param]'],
    ];

    it.each(filepaths)('normalizes a filepath: %s', (filepath, route) => {
      expect(filePathToRoute(filepath)).toEqual(route);
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
      ['/app/file.tsx', true, { static: ['/file'] }],
      ['/app/(group)/page.tsx', true, { static: ['/(group)/page', '/page'] }],
      ['/app/folder/[slug].tsx', true, { dynamic: ['/folder/${CleanRoutePart<T>}'] }],
      [
        '/app/(a,b,c)/(d,e)/page.tsx',
        true,
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
    ] as const;

    it.each(filepaths)('normalizes a filepath: %s', (filepath, expectedResult, expectedRoutes) => {
      const result = addFilePath(filepath);

      expect(result).toEqual(expectedResult);

      if ('static' in expectedRoutes) {
        const actualRoutes = staticRoutes.get(filePathToRoute(filepath));

        expect(actualRoutes?.size).toEqual(expectedRoutes.static.length);

        for (const staticRoute of expectedRoutes.static) {
          expect(actualRoutes).toContain(staticRoute);
        }
      } else {
        const actualRoutes = dynamicRoutes.get(filePathToRoute(filepath));

        expect(actualRoutes?.size).toEqual(expectedRoutes.dynamic.length);

        for (const dynamicRoute of expectedRoutes.dynamic) {
          expect(actualRoutes).toContain(dynamicRoute);
        }
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
