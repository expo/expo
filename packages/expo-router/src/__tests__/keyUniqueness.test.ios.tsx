import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { collectKeys } from '../fork/__tests__/completeness';
import { getStateFromPath } from '../fork/getStateFromPath';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { store } from '../global-state/store';
import { getMockConfig, renderRouter } from '../testing-library';

// S2.1 structural key scheme (`:` separator, `%` escape, `@` root seed): every key embeds its real
// parent chain, so keys are globally unique per mounted instance and fully deterministic. A nested
// navigator's `state.key` is its parent route key verbatim (no marker), so the meaningful invariant
// is: route keys unique among routes, state keys unique among navigators.

const rootState = () => store.navigationRef.current?.getRootState();

const expectUniqueKeys = () => {
  const { routeKeys, stateKeys } = collectKeys(rootState());
  expect(routeKeys.length).toBeGreaterThan(0);
  expect(stateKeys.length).toBeGreaterThan(0);
  expect(new Set(routeKeys).size).toBe(routeKeys.length);
  expect(new Set(stateKeys).size).toBe(stateKeys.length);
};

// An app where a stack route (`[id]`) is itself a nested tab navigator. Pushing the same `[id]`
// route twice mounts two instances of the SAME layout — the case that collided under the old
// pathname scheme (both instances shared a contextKey, so their inner keys were identical).
const duplicateInstanceApp = {
  _layout: () => <Stack />,
  index: () => <Text>root</Text>,
  '[id]/_layout': () => <Tabs />,
  '[id]/index': () => <Text>tab-index</Text>,
  '[id]/second': () => <Text>tab-second</Text>,
};

it('every route/state key in a deep-link tree is unique within its kind', () => {
  renderRouter(duplicateInstanceApp, { initialUrl: '/42/second' });
  expectUniqueKeys();
});

it('keeps every key unique across two mounted instances of the same layout', () => {
  renderRouter(duplicateInstanceApp, { initialUrl: '/index' });

  act(() => router.push('/42/second'));
  act(() => router.push('/43/second'));

  // Two `[id]` instances each carry their own nested tab navigator; nothing collides.
  expectUniqueKeys();
});

// A route name containing the separator (`:`) must stay unique via escaping — the shallow route's
// escaped `:` can't realign onto a deeper route's structural separator.
const colonNameApp = {
  _layout: () => <Stack />,
  index: () => <Text>root</Text>,
  'a:b': () => <Text>colon</Text>,
};

it('keeps keys unique when a route name contains the separator', () => {
  renderRouter(colonNameApp, { initialUrl: '/index' });
  act(() => router.push('/a:b'));
  expectUniqueKeys();
});

it('compiles the same URL to identical, key-for-key state every time (determinism)', () => {
  const config = getMockConfig(duplicateInstanceApp);
  const first = getStateFromPath('/42/second', config);
  const second = getStateFromPath('/42/second', config);
  expect(second).toEqual(first);
});
