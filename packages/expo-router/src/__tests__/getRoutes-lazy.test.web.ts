import { findRouteNodeByName } from '../Route';
import { getRoutes } from '../getRoutes';
import { createLazyContext } from './lazyContext';

const routes = {
  './_layout.tsx': { default: () => null },
  './index.tsx': { default: () => null },
  './anchored/_layout.tsx': { default: () => null, unstable_settings: { anchor: 'index' } },
  './anchored/index.tsx': { default: () => null },
  './anchored/details.tsx': { default: () => null },
};

const options = { skipGenerated: true, ignoreEntryPoints: true, importMode: 'lazy' };

describe('getRoutes in the lazy import mode', () => {
  it('reads the anchor once the layout module has loaded', async () => {
    const lazy = createLazyContext(routes);

    const before = getRoutes(lazy.context, options)!;
    expect(findRouteNodeByName(before, 'anchored')!.initialRouteName).toBeUndefined();

    await lazy.load();

    const after = getRoutes(lazy.context, options)!;
    expect(findRouteNodeByName(after, 'anchored')!.initialRouteName).toBe('index');
  });

  it('returns a loaded module synchronously when the async require stays asynchronous', async () => {
    const lazy = createLazyContext(routes, { alwaysAsync: true });

    const before = getRoutes(lazy.context, options)!;
    const pending = findRouteNodeByName(before, 'anchored')!.loadRoute();
    expect(pending).toHaveProperty('then');

    await lazy.load();
    await pending;

    const after = getRoutes(lazy.context, options)!;
    const anchored = findRouteNodeByName(after, 'anchored')!;
    expect(anchored.loadRoute()).toBe(routes['./anchored/_layout.tsx']);
    expect(anchored.initialRouteName).toBe('index');
  });
});
