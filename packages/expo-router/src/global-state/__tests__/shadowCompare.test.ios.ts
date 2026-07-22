import { shadowTreesMatch } from '../shadowCompare';
import type { NavigationState } from '../../react-navigation/routers';

// A minimal complete navigation state helper for these structural comparisons.
function tree(routes: NavigationState['routes'], index = 0, key = '@'): NavigationState {
  return {
    stale: false,
    type: 'stack',
    key,
    index,
    routeNames: routes.map((r) => r.name),
    routes,
  } as NavigationState;
}

describe('shadowTreesMatch', () => {
  it('treats identical trees as matching', () => {
    const a = tree([{ key: '@:index:0', name: 'index' }]);
    const b = tree([{ key: '@:index:0', name: 'index' }]);

    expect(shadowTreesMatch(a, b)).toBe(true);
  });

  // The eager path and the shadow useReducer each mint a fresh nanoid on the keyless-RESET and
  // empty-reconciliation paths, so two behaviorally-identical reductions produce different route
  // keys. The comparator must treat two minted `name-<nanoid>` keys with the same name as equal.
  it('does not false-fail on freshly minted nanoid keys with the same name', () => {
    const a = tree([{ key: 'modal-V1StGXR8_Z5jdHi6B-myT', name: 'modal' }]);
    const b = tree([{ key: 'modal-9bDixIrET8f4mXPq0sLwZ', name: 'modal' }]);

    expect(shadowTreesMatch(a, b)).toBe(true);
  });

  it('does not false-fail on minted keys nested inside a subtree', () => {
    const a = tree([
      {
        key: '@:home:0',
        name: 'home',
        state: tree([{ key: 'detail-AAAAAAAAAAAAAAAAAAAAA', name: 'detail' }], 0, '@:home:0'),
      },
    ]);
    const b = tree([
      {
        key: '@:home:0',
        name: 'home',
        state: tree([{ key: 'detail-BBBBBBBBBBBBBBBBBBBBB', name: 'detail' }], 0, '@:home:0'),
      },
    ]);

    expect(shadowTreesMatch(a, b)).toBe(true);
  });

  // The oracle must still catch real divergence — otherwise a degenerate "always equal" comparator
  // would silently defeat the whole behavior-neutrality check.
  it('false-negative guard: catches a different route name (not a minted-key difference)', () => {
    const a = tree([{ key: 'modal-V1StGXR8_Z5jdHi6B-myT', name: 'modal' }]);
    const b = tree([{ key: 'sheet-9bDixIrET8f4mXPq0sLwZ', name: 'sheet' }]);

    expect(shadowTreesMatch(a, b)).toBe(false);
  });

  it('false-negative guard: catches an extra route', () => {
    const a = tree([{ key: '@:index:0', name: 'index' }]);
    const b = tree([
      { key: '@:index:0', name: 'index' },
      { key: '@:second:0', name: 'second' },
    ]);

    expect(shadowTreesMatch(a, b)).toBe(false);
  });

  it('false-negative guard: catches a different index', () => {
    const a = tree(
      [
        { key: '@:a:0', name: 'a' },
        { key: '@:b:0', name: 'b' },
      ],
      0
    );
    const b = tree(
      [
        { key: '@:a:0', name: 'a' },
        { key: '@:b:0', name: 'b' },
      ],
      1
    );

    expect(shadowTreesMatch(a, b)).toBe(false);
  });

  // A stable structural key differing must NOT be masked as a minted-key difference: only keys of
  // the `name-<nanoid>` shape are normalized, never the `@:name:index` structural keys.
  it('false-negative guard: does not normalize structural keys', () => {
    const a = tree([{ key: '@:index:0', name: 'index' }]);
    const b = tree([{ key: '@:index:1', name: 'index' }]);

    expect(shadowTreesMatch(a, b)).toBe(false);
  });

  it('false-negative guard: catches divergent params', () => {
    const a = tree([{ key: '@:post:0', name: 'post', params: { id: '1' } }]);
    const b = tree([{ key: '@:post:0', name: 'post', params: { id: '2' } }]);

    expect(shadowTreesMatch(a, b)).toBe(false);
  });
});
