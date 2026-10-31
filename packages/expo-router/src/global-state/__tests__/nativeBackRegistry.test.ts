import type { NavigationState } from '../../react-navigation/routers';
import { createNativeBackRegistry } from '../navigationIntegration';

const tabs: NavigationState = {
  stale: false,
  key: 'tabs',
  type: 'tab',
  index: 0,
  routeKeySeq: 0,
  routeNames: ['home', 'search'],
  routes: [
    { key: 'home', name: 'home' },
    { key: 'search', name: 'search' },
  ],
};
const state: NavigationState = {
  stale: false,
  key: 'root',
  type: 'stack',
  index: 0,
  routeKeySeq: 0,
  routeNames: ['tabs'],
  routes: [{ key: 'tabs-route', name: 'tabs', state: tabs }],
};

test('matching native-looking router types is insufficient without every focused owner', () => {
  const registry = createNativeBackRegistry();
  registry.register('root');
  expect(registry.ownsFocusedChain(state, new Set())).toBe(false);
  const owner = registry.register('tabs');
  expect(registry.ownsFocusedChain(state, new Set())).toBe(true);
  owner.remove();
  expect(registry.ownsFocusedChain(state, new Set())).toBe(false);
});

test('focused removal guards retain JavaScript ownership; unrelated guards do not', () => {
  const registry = createNativeBackRegistry();
  registry.register('root');
  registry.register('tabs');
  expect(registry.ownsFocusedChain(state, new Set(['home']))).toBe(false);
  expect(registry.ownsFocusedChain(state, new Set(['search']))).toBe(true);
});

test('replacement ownership survives stale owner cleanup and repeated removal', () => {
  const registry = createNativeBackRegistry();
  registry.register('root');
  const first = registry.register('tabs');
  const second = registry.register('tabs');
  first.remove();
  first.remove();
  expect(registry.ownsFocusedChain(state, new Set())).toBe(true);
  second.remove();
  expect(registry.ownsFocusedChain(state, new Set())).toBe(false);
});

test('a newly focused unknown child restores the conservative JavaScript path', () => {
  const registry = createNativeBackRegistry();
  registry.register('root');
  registry.register('tabs');
  const changed = {
    ...state,
    routes: [
      {
        ...state.routes[0],
        state: {
          ...tabs,
          routes: [{ ...tabs.routes[0], state: { ...tabs, key: 'unknown-child' } }, tabs.routes[1]],
        },
      },
    ],
  };
  expect(registry.ownsFocusedChain(changed, new Set())).toBe(false);
});

test('a partial focused child is unknown and keeps the JavaScript path', () => {
  const registry = createNativeBackRegistry();
  registry.register('root');
  const partial = {
    ...state,
    routes: [{ ...state.routes[0]!, state: { stale: true as const, routes: [{ name: 'home' }] } }],
  };
  expect(registry.ownsFocusedChain(partial, new Set())).toBe(false);
});
