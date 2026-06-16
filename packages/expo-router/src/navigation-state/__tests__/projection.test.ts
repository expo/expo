import { hydrate } from '../hydration';
import { navigationStateFromTree, project } from '../projection';
import type { GlobalNavState } from '../types';

// Phase 3b — focused-path → URL projection (RFC scenarios 2/3, D1). The independent oracle is a
// round-trip: hydrate(url) → project(tree) returns a normalized-equal URL.

const options = {
  screens: {
    home: { path: 'home', initialRouteName: 'index', screens: { index: '', details: 'details' } },
    search: {
      path: 'search',
      initialRouteName: 'index',
      screens: { index: '', results: 'results' },
    },
    post: { path: 'post/:id' },
  },
} as const;

describe('project', () => {
  it('follows index to the focused leaf, not the array position (RFC scenario 3)', () => {
    // home stack focused on `details` which is NOT the last route — a "serialize last route" bug
    // would yield /home; only honoring `index` yields /home/details.
    const tree: GlobalNavState = {
      root: {
        key: 'root',
        index: 0,
        routes: [
          {
            key: 'home#0',
            name: 'home',
            child: {
              key: 'home/nav',
              index: 0,
              routes: [
                { key: 'details#1', name: 'details' },
                { key: 'index#2', name: 'index' },
              ],
            },
          },
        ],
      },
    };
    expect(project(tree, options)).toBe('/home/details');
  });

  it('converts the tree back to key-free navigation state at every depth', () => {
    const tree: GlobalNavState = {
      root: {
        key: 'root',
        index: 0,
        routes: [
          {
            key: 'home#0',
            name: 'home',
            child: { key: 'home/nav', index: 0, routes: [{ key: 'index#1', name: 'index' }] },
          },
        ],
      },
    };
    expect(navigationStateFromTree(tree)).toEqual({
      index: 0,
      routes: [{ name: 'home', state: { index: 0, routes: [{ name: 'index' }] } }],
    });
  });
});

describe('hydrate ∘ project round-trip (independent oracle)', () => {
  it.each(['/home', '/home/details', '/search', '/search/results', '/post/123', '/post/123?q=x'])(
    'round-trips %s back to itself (incl. params and query)',
    (path) => {
      const tree = hydrate(path, options)!;
      expect(project(tree, options)).toBe(path);
    }
  );
});
