import { act, fireEvent, screen } from '@testing-library/react-native';

import { store } from '../global-state/router-store';
import { useRootNavigationState } from '../hooks';
import { renderHook } from '../hooks/__tests__/renderHook';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { Link } from '../link';
import { renderRouter } from '../testing-library';

const MARKER = '__internal__routerActionState';

function expectNoMarker(state: unknown) {
  expect(JSON.stringify(state)).not.toContain(MARKER);
}

const routes = {
  _layout: () => <Stack />,
  index: () => <Link testID="deep-link" href="/(tabs)/deep/1" />,
  '(tabs)/_layout': () => (
    <Tabs>
      <Tabs.Screen name="deep" />
    </Tabs>
  ),
  '(tabs)/deep/_layout': () => <Stack />,
  '(tabs)/deep/[id]': () => null,
};

it.each([
  ['push', () => router.push('/(tabs)/deep/1')],
  ['navigate', () => router.navigate('/(tabs)/deep/1')],
  ['replace', () => router.replace('/(tabs)/deep/1')],
  ['dismissTo', () => router.dismissTo('/(tabs)/deep/1')],
  ['prefetch', () => router.prefetch('/(tabs)/deep/1')],
  ['Link press', () => fireEvent.press(screen.getByTestId('deep-link'))],
])('store.state has no marker after %s', (_, navigate) => {
  renderRouter(routes);

  act(navigate);

  expectNoMarker(store.state);
});

it('useRootNavigationState has no marker', () => {
  const { result } = renderHook(
    () => useRootNavigationState(),
    ['index', '(tabs)/_layout', '(tabs)/deep/_layout', '(tabs)/deep/[id]']
  );

  act(() => router.navigate('/(tabs)/deep/1'));

  expectNoMarker(result.current);
});

it('warns and ignores action state without the internal marker', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    second: () => null,
  });

  act(() =>
    store.navigationRef.current!.dispatch({
      type: 'NAVIGATE',
      payload: { name: 'second', state: { routes: [{ name: 'nested' }] } },
    })
  );

  expect(warning).toHaveBeenCalledWith(expect.stringContaining(MARKER));
  const layoutState = store.navigationRef.current!.getRootState().routes[0]!.state!;
  expect(layoutState.routes.find((route) => route.name === 'second')?.state).toBeUndefined();
  warning.mockRestore();
});
