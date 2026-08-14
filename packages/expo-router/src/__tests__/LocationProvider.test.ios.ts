import { getNormalizedStatePath, getRouteInfoFromState } from '../LocationProvider';

describe(getNormalizedStatePath, () => {
  // Ensure all values are correctly decoded
  it(`returns the normalized path`, () => {
    expect(
      getNormalizedStatePath({
        path: '/foo/bar%20baz?alpha=beta',
        params: {
          alpha: 'beta other',
          beta: 'gamma',
          charlie: 'delta%20echo',
          delta: ['evan', 'foxtrot%20gamma', 'hotel india'],
          params: { nested: 'value%20with%20spaces' },
        },
      })
    ).toEqual({
      segments: ['foo', 'bar baz'],
      params: {
        alpha: 'beta other',
        beta: 'gamma',
        charlie: 'delta echo',
        // Ensure arrays are preserved (rest params).
        delta: ['evan', 'foxtrot gamma', 'hotel india'],
        params: '[object Object]',
      },
    });
  });

  it(`returns the normalized path with a baseUrl`, () => {
    expect(
      getNormalizedStatePath(
        {
          path: '/one/two/foo/bar%20baz?alpha=beta',
          params: {
            alpha: 'beta other',
            beta: 'gamma',
            charlie: 'delta%20echo',
            delta: ['evan', 'foxtrot%20gamma', 'hotel india'],
          },
        },
        '/one/two'
      )
    ).toEqual({
      segments: ['foo', 'bar baz'],
      params: {
        alpha: 'beta other',
        beta: 'gamma',
        charlie: 'delta echo',
        // Ensure arrays are preserved (rest params).
        delta: ['evan', 'foxtrot gamma', 'hotel india'],
      },
    });
  });
});

it('does not treat a screen=index param as an index route', () => {
  const getPath = jest.fn((_state, _asPath: boolean) => ({
    path: '/page?screen=index',
    params: { screen: 'index' },
  }));

  expect(
    getRouteInfoFromState(getPath, {
      routes: [{ name: 'page', params: { screen: 'index' } }],
    }).isIndex
  ).toBe(false);
});
