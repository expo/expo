import {
  isMovingToSiblingRoute,
  findTopRouteForTarget,
  getQualifiedStateForTopOfTargetState,
  getEarliestMismatchedRoute,
} from '../stateOperations';

describe(getEarliestMismatchedRoute, () => {
  it(`finds earliest mismatched route`, () => {
    expect(
      getEarliestMismatchedRoute(
        {
          type: 'tab',
          index: 0,
          routes: [
            {
              name: 'root',
              state: {
                type: 'stack',
                index: 0,
                routes: [
                  {
                    name: '(auth)/sign-in',
                  },
                ],
              },
            },
            {
              name: '_sitemap',
            },
            {
              name: '[...404]',
            },
          ],
        },
        {
          name: 'root',
          path: '',
          initial: true,
          screen: 'root',
          params: {
            initial: true,
            screen: '(app)',
            path: '',
            params: {
              initial: true,
              screen: 'index',
              path: '/root',
            },
          },
        }
      )
    ).toEqual({
      name: '(app)',
      type: 'stack',
      params: {
        initial: true,
        path: '/root',
        screen: 'index',
      },
    });
  });

  it(`returns top-level match`, () => {
    expect(
      getEarliestMismatchedRoute(
        {
          type: 'tab',
          index: 1,
          routes: [
            {
              name: 'root',
            },
            {
              name: '_sitemap',
            },
            {
              name: '[...404]',
            },
          ],
        },
        {
          name: 'root',
          path: '',
          initial: true,
          screen: 'root',
          params: {
            initial: true,
            screen: '(app)',
            path: '',
            params: {
              initial: true,
              screen: 'index',
              path: '/root',
            },
          },
        }
      )
    ).toEqual({
      name: 'root',
      params: {
        initial: true,
        params: { initial: true, path: '/root', screen: 'index' },
        path: '',
        screen: '(app)',
      },
      type: 'tab',
    });
  });
});

describe(findTopRouteForTarget, () => {
  it(`finds the top route`, () => {
    expect(
      findTopRouteForTarget({
        routes: [
          {
            name: 'one',
            state: {
              routes: [
                {
                  name: 'two',
                },
              ],
            },
          },
        ],
      })
    ).toEqual({ name: 'two' });
  });
  it(`finds the top route with initial routes`, () => {
    expect(
      findTopRouteForTarget({
        routes: [
          { name: 'three' },
          {
            name: 'one',
            state: {
              routes: [
                { name: 'four' },
                {
                  name: 'two',
                },
              ],
            },
          },
        ],
      })
    ).toEqual({ name: 'two' });
  });
});

describe(getQualifiedStateForTopOfTargetState, () => {
  it(`returns the common state`, () => {
    expect(
      getQualifiedStateForTopOfTargetState(
        {
          type: 'stack',
          index: 0,
          routeNames: ['(app)', '_sitemap', '[...404]'],
          routes: [
            {
              name: '(app)',
              state: {
                type: 'stack',
                index: 1,
                routeNames: ['index', 'two', 'send', 'permissions'],
                routes: [
                  {
                    name: 'index',
                  },
                  {
                    name: 'two',
                    path: '/two',
                  },
                ],
              },
            },
          ],
        },
        {
          routes: [
            {
              name: '(app)',
              state: {
                index: 1,
                routes: [
                  {
                    name: 'index',
                  },
                  {
                    name: 'send',
                    path: '/send',
                  },
                ],
              },
            },
          ],
        }
      )
    ).toEqual({
      index: 1,
      routeNames: ['index', 'two', 'send', 'permissions'],
      routes: [{ name: 'index' }, { name: 'two', path: '/two' }],
      type: 'stack',
    });
  });

  it(`returns nested qualified state`, () => {
    expect(
      getQualifiedStateForTopOfTargetState(
        {
          type: 'tab',
          index: 0,
          routeNames: ['index', 'two', 'four', 'three', '_sitemap', '[...404]'],

          routes: [
            {
              name: 'index',
            },
            {
              name: 'two',
              state: {
                type: 'stack',
                index: 0,
                routeNames: ['index', 'beta'],
                routes: [
                  {
                    name: 'index',
                    path: '/two',
                  },
                ],
              },
            },
            {
              name: 'four',
            },
            {
              name: 'three',
            },
            {
              name: '_sitemap',
            },
            {
              name: '[...404]',
            },
          ],
        },
        {
          routes: [
            {
              name: 'two',
              state: {
                routes: [
                  {
                    name: 'index',
                    path: '/two',
                  },
                ],
              },
            },
          ],
        }
      )
    ).toEqual({
      index: 0,
      routeNames: ['index', 'beta'],
      routes: [{ name: 'index', path: '/two' }],
      type: 'stack',
    });
  });
});

describe(isMovingToSiblingRoute, () => {
  it(`returns true when moving from a high-level modal (/modal) to the first tab (/(tabs)/index)`, () => {
    // Discovered in Expo SDK 49 beta from the tabs template.
    // Going to `/_sitemap` -> `/foobar` (missing) -> `/` (pop back home).
    // didn't work because it assumed `/modal` and `/(tabs)/index` were sibling routes.
    expect(
      isMovingToSiblingRoute(
        {
          stale: false,
          type: 'stack',
          key: 'stack-a5P8_EsAnIzvh34s0mPr6',
          index: 1,
          routeNames: ['(tabs)', '_sitemap', '[...missing]'],
          routes: [
            {
              name: '(tabs)',
              key: '(tabs)-nQhC-Q4Ldn0JOaFgDVqsY',
              state: {
                stale: false,
                type: 'tab',
                key: 'tab-EpWWwS_dplNQEmSOBgnjg',
                index: 0,
                routeNames: ['index', 'two'],
                history: [
                  {
                    type: 'route',
                    key: 'index-3a4SpcHaMEUdxuaVnGGZ0',
                  },
                ],
                routes: [
                  {
                    name: 'index',
                    key: 'index-3a4SpcHaMEUdxuaVnGGZ0',
                  },
                  {
                    name: 'two',
                    key: 'two-rQPjCgQDfXpHU2Ft-6t3A',
                  },
                ],
              },
            },
            {
              name: '[...missing]',
              params: {
                missing: ['[...missing]', '1687982087761'],
              },
              path: '/[...missing]/1687982087761',
              key: '[...missing]-7uOsFmuZMfC6Q8bgOm7Ig',
            },
          ],
        },
        {
          routes: [
            {
              name: '(tabs)',
              state: {
                routes: [
                  {
                    name: 'index',
                    path: '/',
                  },
                ],
              },
            },
          ],
        }
      )
    ).toBe(true);
  });

  it(`returns false`, () => {
    expect(
      isMovingToSiblingRoute(
        {
          type: 'tab',
          index: 0,
          routes: [
            {
              name: 'index',
            },
            {
              name: 'two',
              params: {
                initial: true,
                screen: 'index',
                path: '/two',
              },
              state: {
                type: 'stack',
                key: 'stack-VMqQmYOqAsiJFz0PcXxDV',
                index: 1,
                routeNames: ['index', 'beta'],
                routes: [
                  {
                    name: 'beta',
                  },
                  {
                    name: 'index',
                    path: '/two',
                  },
                ],
              },
            },
          ],
        },
        {
          routes: [
            {
              name: 'two',
              state: {
                routes: [
                  {
                    name: 'index',
                    path: '/two',
                  },
                ],
              },
            },
          ],
        }
      )
    ).toBe(false);
  });
  it(`returns true`, () => {
    // Moving from /index to /compose
    expect(
      isMovingToSiblingRoute(
        {
          stale: false,
          type: 'stack',
          key: 'stack-ufSP1t4BKV-9JHUrsMFje',
          index: 0,
          routeNames: ['(app)', '_sitemap', '(auth)/sign-in', '[...404]'],
          routes: [
            {
              name: '(app)',
              state: {
                stale: false,
                type: 'stack',
                key: 'stack-WGuvSdOQTVdKFB0xn02sG',
                index: 0,
                routeNames: ['index', 'compose', 'note/[note]'],
                routes: [
                  {
                    name: 'index',
                    path: '/',
                    key: 'index-t4yhmcdkL8Uw_YvZDshj4',
                  },
                ],
              },
              key: '(app)-HJs7pocOQpWMG1CKd6Be-',
            },
          ],
        },
        {
          routes: [
            {
              name: '(app)',
              state: {
                index: 1,
                routes: [
                  {
                    name: 'index',
                  },
                  {
                    name: 'compose',
                    path: '/compose',
                  },
                ],
              },
            },
          ],
        }
      )
    ).toBe(true);
  });
});
