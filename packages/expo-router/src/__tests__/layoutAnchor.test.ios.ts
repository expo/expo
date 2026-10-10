import type { RouteNode } from '../Route';
import {
  collectMissingLayouts,
  getLayoutAnchor,
  getGroupMatchingRouteName,
  loadLayouts,
  withLoadedLayouts,
} from '../layoutAnchor';

// The nodes only have the fields that anchor reads use.
function routeNode(fields: Partial<RouteNode>) {
  return { type: 'route', children: [], contextKey: './file.tsx', ...fields } as RouteNode;
}

function layoutNode({
  loadRoute = jest.fn(() => ({})),
  routes = ['a', 'b'],
  groupName,
}: {
  loadRoute?: jest.Mock;
  routes?: string[];
  groupName?: string;
} = {}) {
  const node = routeNode({
    type: 'layout',
    contextKey: './_layout.tsx',
    children: routes.map((route) => routeNode({ route })),
    loadRoute,
    groupName,
  });
  return { node, loadRoute };
}

// Like async routes on native, `loadRoute` returns a new promise on every call.
function asyncLayoutNode() {
  return layoutNode({
    loadRoute: jest.fn(() => Promise.resolve({ unstable_settings: { anchor: 'b' } })),
  });
}

// A layout whose sync `loadRoute` returns these settings.
function anchorOf(settings: object | undefined, groupName?: string, routes?: string[]) {
  return getLayoutAnchor(
    layoutNode({ loadRoute: jest.fn(() => ({ unstable_settings: settings })), groupName, routes })
      .node
  );
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

describe('getLayoutAnchor', () => {
  it.each(['route', 'api', 'redirect', 'rewrite'] as const)(
    'returns undefined for a %s node',
    (type) => {
      const loadRoute = jest.fn(() => ({ unstable_settings: { anchor: 'a' } }));

      expect(getLayoutAnchor(routeNode({ type, loadRoute }))).toBeUndefined();
      expect(loadRoute).not.toHaveBeenCalled();
    }
  );

  it('returns undefined while the layout loads, then the anchor after it loads', async () => {
    const { node } = asyncLayoutNode();

    expect(getLayoutAnchor(node)).toBeUndefined();
    await loadLayouts([node]);

    expect(getLayoutAnchor(node)).toBe('b');
  });

  it('calls `loadRoute` once for all reads made while the layout loads', async () => {
    const { node, loadRoute } = asyncLayoutNode();

    expect(getLayoutAnchor(node)).toBeUndefined();
    expect(getLayoutAnchor(node)).toBeUndefined();
    await loadLayouts([node]);

    expect(loadRoute).toHaveBeenCalledTimes(1);
    expect(getLayoutAnchor(node)).toBe('b');
  });

  it('keeps the first anchor even if `loadRoute` returns a different one later', () => {
    const { node } = layoutNode({
      loadRoute: jest
        .fn()
        .mockReturnValueOnce({ unstable_settings: { anchor: 'a' } })
        .mockReturnValue({ unstable_settings: { anchor: 'b' } }),
    });

    expect(getLayoutAnchor(node)).toBe('a');
    expect(getLayoutAnchor(node)).toBe('a');
  });

  it('uses the route named like the group for a skipped layout without loading it', () => {
    const { node, loadRoute } = layoutNode({
      loadRoute: jest.fn(() => ({ unstable_settings: { anchor: 'a' } })),
      groupName: 'b',
    });

    const { value, missing } = collectMissingLayouts(() => getLayoutAnchor(node), new Set([node]));

    expect(value).toBe('b');
    expect(missing).toEqual([]);
    expect(loadRoute).not.toHaveBeenCalled();
  });

  it.each([
    ['no settings', undefined, undefined, undefined],
    ['the route named like the group', undefined, 'b', 'b'],
    ['`anchor`', { anchor: 'a' }, 'b', 'a'],
    ['`initialRouteName`', { initialRouteName: 'a' }, 'b', 'a'],
    ['`anchor` over `initialRouteName`', { anchor: 'a', initialRouteName: 'b' }, undefined, 'a'],
    ['the group `anchor`', { anchor: 'a', b: { anchor: 'b' } }, 'b', 'b'],
    ['the group `initialRouteName`', { anchor: 'a', b: { initialRouteName: 'b' } }, 'b', 'b'],
    ['`anchor` when the group has no settings', { anchor: 'a', c: { anchor: 'b' } }, 'b', 'a'],
  ])('uses %s', (_, settings, groupName, expected) => {
    expect(anchorOf(settings, groupName)).toBe(expected);
  });

  it('returns the `index` route of an anchor directory', () => {
    expect(anchorOf({ anchor: 'a' }, undefined, ['a/index', 'b'])).toBe('a/index');
  });

  it.each([
    [{ initialRouteName: 'a' }, undefined],
    [{ b: { initialRouteName: 'a' } }, 'b'],
  ])('warns that `initialRouteName` is deprecated for %j', (settings, groupName) => {
    anchorOf(settings, groupName);

    expect(warn).toHaveBeenCalledWith(
      '`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.'
    );
  });

  it('does not warn for `anchor`', () => {
    anchorOf({ anchor: 'a', b: { anchor: 'b' } }, 'b');

    expect(warn).not.toHaveBeenCalled();
  });

  it('throws when the anchor is not a route in the layout', () => {
    expect(() => anchorOf({ anchor: 'c' })).toThrow(
      'The initial route name "c" was not found in the layout at "./_layout.tsx". Available routes are: "a", "b".'
    );
  });

  it('throws with the group name when the group anchor is not a route in the layout', () => {
    expect(() => anchorOf({ b: { anchor: 'c' } }, 'b')).toThrow(
      'The initial route name "c" for group "b" was not found'
    );
  });
});

describe('getGroupMatchingRouteName', () => {
  it('returns the route named like the group', () => {
    const { node } = layoutNode({ routes: ['a', 'b'], groupName: 'b' });

    expect(getGroupMatchingRouteName(node)).toBe('b');
  });

  it('returns the `index` route of the directory named like the group', () => {
    const { node } = layoutNode({ routes: ['a', 'b/index'], groupName: 'b' });

    expect(getGroupMatchingRouteName(node)).toBe('b/index');
  });

  it('returns undefined without a group', () => {
    const { node } = layoutNode({ routes: ['a', 'b'] });

    expect(getGroupMatchingRouteName(node)).toBeUndefined();
  });

  it('returns undefined when no route is named like the group', () => {
    const { node } = layoutNode({ routes: ['a', 'b'], groupName: 'c' });

    expect(getGroupMatchingRouteName(node)).toBeUndefined();
  });
});

describe('loadLayouts', () => {
  it('returns no layouts for no layouts', async () => {
    await expect(loadLayouts([])).resolves.toEqual([]);
  });

  it('loads a layout whose `loadRoute` returns the module', async () => {
    const { node } = layoutNode({
      loadRoute: jest.fn(() => ({ unstable_settings: { anchor: 'a' } })),
    });

    await expect(loadLayouts([node])).resolves.toEqual([]);
    expect(getLayoutAnchor(node)).toBe('a');
  });

  it('loads a layout whose `loadRoute` returns a thenable that is not a promise', async () => {
    const module = { unstable_settings: { anchor: 'a' } };
    const { node } = layoutNode({
      loadRoute: jest.fn(() => ({ then: (resolve: (value: object) => void) => resolve(module) })),
    });

    await expect(loadLayouts([node])).resolves.toEqual([]);
    expect(getLayoutAnchor(node)).toBe('a');
  });

  it('does not call `loadRoute` again for a layout that is already loaded', async () => {
    const { node, loadRoute } = asyncLayoutNode();

    await loadLayouts([node]);
    await loadLayouts([node]);

    expect(loadRoute).toHaveBeenCalledTimes(1);
  });

  it('returns only the layouts that failed to load and warns for each', async () => {
    const error = new Error('Network error');
    const failed = layoutNode({ loadRoute: jest.fn(() => Promise.reject(error)) }).node;
    const loaded = asyncLayoutNode().node;

    await expect(loadLayouts([loaded, failed])).resolves.toEqual([failed]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('could not load the layout "./_layout.tsx"'),
      error
    );
  });

  it('calls `loadRoute` again after a failed load', async () => {
    const { node, loadRoute } = layoutNode({
      loadRoute: jest
        .fn()
        .mockReturnValueOnce(Promise.reject(new Error('Network error')))
        .mockReturnValue(Promise.resolve({ unstable_settings: { anchor: 'a' } })),
    });

    await expect(loadLayouts([node])).resolves.toEqual([node]);
    await expect(loadLayouts([node])).resolves.toEqual([]);

    expect(loadRoute).toHaveBeenCalledTimes(2);
    expect(getLayoutAnchor(node)).toBe('a');
  });
});

describe('collectMissingLayouts', () => {
  it('returns the value and each layout that is still loading once', () => {
    const first = asyncLayoutNode().node;
    const second = asyncLayoutNode().node;

    const result = collectMissingLayouts(() => {
      getLayoutAnchor(first);
      getLayoutAnchor(first);
      getLayoutAnchor(second);
      return 'value';
    });

    expect(result).toEqual({ value: 'value', missing: [first, second] });
  });

  it('does not record loaded layouts', () => {
    const { node } = layoutNode();

    expect(collectMissingLayouts(() => getLayoutAnchor(node)).missing).toEqual([]);
  });

  it('keeps the layouts of a nested call out of the outer result', () => {
    const inner = asyncLayoutNode().node;
    const outer = asyncLayoutNode().node;

    const result = collectMissingLayouts(() => {
      const nested = collectMissingLayouts(() => getLayoutAnchor(inner));
      getLayoutAnchor(outer);
      return nested.missing;
    });

    expect(result).toEqual({ value: [inner], missing: [outer] });
  });

  it('records into the outer call after a nested call throws', () => {
    const { node } = asyncLayoutNode();

    const { missing } = collectMissingLayouts(() => {
      expect(() =>
        collectMissingLayouts(() => {
          throw new Error('Failed');
        })
      ).toThrow('Failed');
      getLayoutAnchor(node);
    });

    expect(missing).toEqual([node]);
  });
});

describe('withLoadedLayouts', () => {
  it('returns the value without a promise when no layout is missing', () => {
    const { node } = layoutNode({
      loadRoute: jest.fn(() => ({ unstable_settings: { anchor: 'a' } })),
    });

    expect(withLoadedLayouts(() => getLayoutAnchor(node))).toBe('a');
  });

  it('runs again after the missing layouts load', async () => {
    const { node } = asyncLayoutNode();
    const fn = jest.fn(() => getLayoutAnchor(node));

    await expect(withLoadedLayouts(fn)).resolves.toBe('b');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('loads a layout that is only read after another layout loads', async () => {
    const first = asyncLayoutNode().node;
    const second = asyncLayoutNode().node;
    const fn = jest.fn(() => getLayoutAnchor(first) && getLayoutAnchor(second));

    await expect(withLoadedLayouts(fn)).resolves.toBe('b');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses the route named like the group for a layout that failed to load', async () => {
    const { node } = layoutNode({
      loadRoute: jest.fn(() => Promise.reject(new Error('Network error'))),
      groupName: 'a',
    });
    const fn = jest.fn(() => getLayoutAnchor(node));

    await expect(withLoadedLayouts(fn)).resolves.toBe('a');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
