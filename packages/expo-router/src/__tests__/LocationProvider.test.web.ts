import { getNormalizedStatePath } from '../LocationProvider';

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
      },
    });
  });

  it(`returns the normalized path with a basePath`, () => {
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
