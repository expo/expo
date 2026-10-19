import { getPathFromState } from '../getPathFromState';
import { getStateFromPath } from '../getStateFromPath';

// Runs on every platform: the path builder is shared by web and native linking.
it.each([['a?b c', '50%', 'd#e'], 'a?b c/50%/d#e'])(
  'encodes each catch-all segment (%j)',
  (slug) => {
    const config = { screens: { '[...slug]': '*slug' } };
    const path = getPathFromState({ routes: [{ name: '[...slug]', params: { slug } }] }, config);

    expect(path).toBe('/a%3Fb%20c/50%25/d%23e');
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      slug: ['a?b c', '50%', 'd#e'],
    });
  }
);
