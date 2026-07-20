import { screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { store } from '../global-state/store';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { renderRouter } from '../testing-library';

// `+not-found` / `_sitemap` mount as siblings of the real `__root` slot. Navigation away from them
// must POP the transient route (removing it) while preserving the rest of the history — never stack a
// duplicate `__root`, and never reset the whole tree.
function rootSlots() {
  return store.state?.routes.map((r) => r.name) ?? [];
}
function rootStackNames() {
  const root = store.state?.routes.find((r) => r.name === '__root');
  return root?.state?.routes.map((r) => r.name) ?? [];
}

const app = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  index: () => <Text testID="home">Home</Text>,
  'a/index': () => <Text testID="a">A</Text>,
  'b/index': () => <Text testID="b">B</Text>,
  'tabs/index': () => <Text testID="t">Tabs</Text>,
};

test('navigating away from +not-found pops it and preserves history', () => {
  renderRouter(app, { initialUrl: '/' });

  act(() => router.push('/a'));
  act(() => router.push('/b'));
  expect(rootStackNames()).toEqual(['index', 'a/index', 'b/index']);

  act(() => router.navigate('/does-not-exist-xyz'));
  expect(rootSlots()).toEqual(['__root', '+not-found']);

  act(() => router.navigate('/tabs'));

  // `+not-found` popped (single `__root`), and the prior history is preserved with the target added.
  expect(rootSlots()).toEqual(['__root']);
  expect(rootStackNames()).toEqual(['index', 'a/index', 'b/index', 'tabs/index']);
  expect(screen).toHavePathname('/tabs');
});

test('pushing away from +not-found pops it and preserves history', () => {
  renderRouter(app, { initialUrl: '/' });

  act(() => router.push('/a'));
  act(() => router.push('/b'));

  act(() => router.navigate('/does-not-exist-xyz'));
  expect(rootSlots()).toEqual(['__root', '+not-found']);

  // A push from a transient route resolves to the target (pop + navigate) rather than stacking a
  // duplicate `__root`; the prior history is preserved.
  act(() => router.push('/tabs'));

  expect(rootSlots()).toEqual(['__root']);
  expect(rootStackNames()).toEqual(['index', 'a/index', 'b/index', 'tabs/index']);
  expect(screen).toHavePathname('/tabs');
});

test('back from +not-found returns to the previous screen with history intact', () => {
  renderRouter(app, { initialUrl: '/' });

  act(() => router.push('/a'));
  act(() => router.push('/b'));

  act(() => router.navigate('/does-not-exist-xyz'));
  expect(rootSlots()).toEqual(['__root', '+not-found']);

  act(() => router.back());

  expect(rootSlots()).toEqual(['__root']);
  expect(rootStackNames()).toEqual(['index', 'a/index', 'b/index']);
  expect(screen).toHavePathname('/b');
});
