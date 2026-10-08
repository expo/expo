import { findRouteNodeByName } from '../Route';
import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

const routes = {
  _layout: () => null,
  index: () => null,
  'anchored/_layout': { default: () => null, unstable_settings: { anchor: 'index' } },
  'anchored/index': () => null,
  'anchored/details': () => null,
  'other/_layout': () => null,
  'other/index': () => null,
};

const options = { skipGenerated: true, ignoreEntryPoints: true, importMode: 'lazy' };

function createContext() {
  const lazy = inMemoryContext(routes, { lazy: true });
  return Object.assign(jest.fn(lazy), lazy);
}

describe('getRoutes in the lazy import mode', () => {
  it('does not load any route while building the route tree', () => {
    const context = createContext();

    getRoutes(context, options);

    expect(context).not.toHaveBeenCalled();
  });

  it('reads the anchor once the layout module has loaded', async () => {
    const context = createContext();

    const before = getRoutes(context, options)!;
    const anchored = findRouteNodeByName(before, 'anchored')!;
    expect(anchored.initialRouteName).toBeUndefined();

    await anchored.loadRoute();

    const after = getRoutes(context, options)!;
    expect(findRouteNodeByName(after, 'anchored')!.initialRouteName).toBe('index');
    // Only the layout that was loaded explicitly was requested.
    expect(context.mock.calls).toEqual([['./anchored/_layout.js']]);
  });
});
