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
          key: 'stack-FS_ZJZ0VEQWAtuFrQv1wV',
          index: 0,
          routeNames: ['(app)', '_sitemap', '[...404]'],
          routes: [
            {
              name: '(app)',
              state: {
                type: 'stack',
                key: 'stack-L59x2fFlmmVjUY9-zrPLk',
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
      key: 'stack-L59x2fFlmmVjUY9-zrPLk',
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
