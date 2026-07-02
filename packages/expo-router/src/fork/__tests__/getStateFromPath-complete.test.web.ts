import { expectComplete } from './completeness';
import { getRouteKey } from '../../react-navigation/routers/getRouteKey';
import { getMockConfig } from '../../testing-library';
import { getStateFromPath } from '../getStateFromPath';

describe('completeness', () => {
  it('emits a complete, keyed state for a nested app config', () => {
    const config = getMockConfig(['_layout', '(tabs)/_layout', '(tabs)/index', '(tabs)/second']);
    const state = getStateFromPath('/second', config);

    expectComplete(state);

    // Container level: `__root` is the focused route, keyed name-only (container pathname undefined).
    expect(state!.routes[0]!.name).toBe('__root');
    expect(state!.routes[0]!.key).toBe('__root');
    expect(state!.routeNames).toContain('__root');

    // app/_layout level (pathname '').
    const rootState = state!.routes[0]!.state!;
    expect(rootState.routes.find((r) => r.name === '(tabs)')!.key).toBe(getRouteKey('', '(tabs)'));

    // (tabs) level (pathname '/(tabs)').
    const tabsState = rootState.routes.find((r) => r.name === '(tabs)')!.state!;
    const second = tabsState.routes.find((r) => r.name === 'second')!;
    expect(second.key).toBe(getRouteKey('/(tabs)', 'second'));
    expect(second.key).toBe('/(tabs)-second');
  });

  it('computes tab index route keys as getRouteKey(pathname, name)', () => {
    const config = getMockConfig(['_layout', '(tabs)/_layout', '(tabs)/index', '(tabs)/second']);
    const state = getStateFromPath('/', config);

    const tabsState = state!.routes[0]!.state!.routes.find((r) => r.name === '(tabs)')!.state!;
    const index = tabsState.routes.find((r) => r.name === 'index')!;
    expect(index.key).toBe(getRouteKey('/(tabs)', 'index'));
    expect(index.key).toBe('/(tabs)-index');
  });

  it('is deterministic: identical inputs produce deeply identical output including keys', () => {
    const config = getMockConfig(['_layout', '(tabs)/_layout', '(tabs)/index', '(tabs)/second']);
    const a = getStateFromPath('/second', config);
    const b = getStateFromPath('/second', config);
    expect(a).toEqual(b);
  });
});

describe('config-aware completeness', () => {
  // A navigator route (its config entry declares non-empty `screens`) must carry a nested state.
  // Without the config, `expectComplete` can't tell a hollow navigator route from a genuine leaf.
  const screens = { Home: { screens: { Feed: 'feed' } } };

  it('rejects a navigator route missing its subtree when given the config', () => {
    const hollow = {
      stale: false as const,
      key: 'navigator',
      index: 0,
      routeNames: ['Home'],
      // `Home` is a navigator per `screens`, but has no nested `state`.
      routes: [{ key: 'Home', name: 'Home' }],
    };

    expect(() => expectComplete(hollow, screens)).toThrow(/Home/);
  });

  it('accepts a navigator route that carries its subtree', () => {
    const state = getStateFromPath('/feed', {
      screens: { Home: { screens: { Feed: 'feed' } } },
    } as any);
    // Config-aware check: `Home` must (and does) carry its nested state.
    expectComplete(state, { Home: { screens: { Feed: 'feed' } } });
  });
});

describe('declared anchors', () => {
  it('inserts a declared anchor before the focused route', () => {
    const config = {
      initialRouteName: 'feed',
      screens: {
        feed: 'feed',
        profile: 'profile',
      },
    };

    const state = getStateFromPath('/profile', config as any);
    expectComplete(state);
    expect(state!.index).toBe(1);
    expect(state!.routeNames).toEqual(['feed', 'profile']);
    expect(state!.routes.map((r) => r.name)).toEqual(['feed', 'profile']);
  });

  it('materializes a full subtree when the declared anchor is itself a navigator', () => {
    const config = {
      screens: {
        Home: {
          initialRouteName: 'Feed',
          screens: {
            // Feed is itself a navigator — its complete subtree must ride along.
            Feed: {
              screens: {
                FeedList: 'feed',
              },
            },
            Profile: 'profile',
          },
        },
      },
    };

    const state = getStateFromPath('/profile', config as any);
    expectComplete(state);

    const home = state!.routes.find((r) => r.name === 'Home')!;
    const homeState = home.state!;
    expect(homeState.index).toBe(1);
    expect(homeState.routes.map((r) => r.name)).toEqual(['Feed', 'Profile']);

    // The anchor `Feed` is a navigator, so it carries a complete state down to its leaf `FeedList`.
    const feed = homeState.routes[0]!;
    expect(feed.name).toBe('Feed');
    expect(feed.state).toBeDefined();
    expect(feed.state!.routes.map((r) => r.name)).toEqual(['FeedList']);
    expect(feed.state!.routes[0]!.key).toBe(getRouteKey('/Feed', 'FeedList'));
  });
});

describe('route groups and current segments', () => {
  // Two groups resolve `/settings` to the same public URL; `currentSegments` breaks the tie.
  const config = getMockConfig(['_layout', '(app)/settings', '(admin)/settings']);

  const groupFor = (state: ReturnType<typeof getStateFromPath>) =>
    state!.routes[0]!.state!.routes[0]!.name;

  it('breaks group ties using current segments', () => {
    const state = getStateFromPath('/settings', config, ['(admin)']);
    expectComplete(state);
    expect(groupFor(state)).toBe('(admin)/settings');
  });

  it('falls back to stable config order without current segments', () => {
    const state = getStateFromPath('/settings', config);
    expectComplete(state);
    expect(groupFor(state)).toBe('(app)/settings');
  });
});

describe('catch-all, not-found and no-match', () => {
  it('matches a catch-all route', () => {
    const state = getStateFromPath('/docs/routing/deep-linking', {
      screens: { docs: 'docs/*rest' },
    } as any);
    expectComplete(state);
    expect(state!.routes[0]!.name).toBe('docs');
    expect(state!.routes[0]!.params).toEqual({ rest: ['routing', 'deep-linking'] });
  });

  it('matches a not-found fallback', () => {
    const state = getStateFromPath('/missing/page', getMockConfig(['+not-found', 'index']));
    expectComplete(state);
    const notFound = state!.routes[0]!.state!.routes[0]!;
    expect(notFound.name).toBe('+not-found');
    expect(notFound.params).toEqual({ 'not-found': ['missing', 'page'] });
  });

  it('returns undefined when nothing matches', () => {
    const state = getStateFromPath('/missing/page', {
      screens: { index: '', settings: 'settings' },
    } as any);
    expect(state).toBeUndefined();
  });
});
