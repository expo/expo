import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import * as rootReducerModule from '../global-state/rootReducer';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import Tabs from '../layouts/TabsClient';
import { renderRouter, screen } from '../testing-library';

// The Step-2 shadow `useReducer` reduces every action in parallel with the committed sync store and
// a dev-only assertion checks they agree. These tests prove that oracle: it stays silent through
// real navigation (behavior-neutrality) and fires when the two genuinely diverge.

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

function shadowDivergenceErrors() {
  return errorSpy.mock.calls.filter(
    (call) => typeof call[0] === 'string' && call[0].includes('shadow reducer diverged')
  );
}

it('stays silent across real navigation (shadow tracks the committed store)', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'profile/[id]': () => <Text testID="profile">Profile</Text>,
    second: () => <Text testID="second">Second</Text>,
  });

  act(() => router.push('/profile/123'));
  act(() => router.push('/second'));
  act(() => router.push('/profile/456'));
  act(() => router.back());

  expect(screen.getByTestId('second')).toBeVisible();
  expect(shadowDivergenceErrors()).toHaveLength(0);
});

it('stays silent when navigating into a nested navigator', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'inner/_layout': () => <Stack />,
    'inner/index': () => <Text testID="inner-index">Inner Index</Text>,
    'inner/second': () => <Text testID="inner-second">Inner Second</Text>,
  });

  act(() => router.push('/inner'));
  act(() => router.push('/inner/second'));

  expect(screen.getByTestId('inner-second')).toBeVisible();
  expect(shadowDivergenceErrors()).toHaveLength(0);
});

it('stays silent through tabs with sibling-tab preload', () => {
  // Tabs preload their sibling tabs on mount (a FRONT_PRELOAD adding the unfocused tab). That fills
  // the committed tree a commit after the focused-path seed — the scenario whose one-commit lag the
  // shadow seq-matching exists to handle. The oracle must stay silent through it.
  renderRouter(
    {
      _layout: () => <Tabs />,
      index: () => <Text testID="index">Index</Text>,
      'nested/_layout': () => <Stack />,
      'nested/a': () => <Text testID="nested-a">A</Text>,
      'nested/b': () => <Text testID="nested-b">B</Text>,
    },
    { initialUrl: '/nested/a' }
  );

  act(() => router.push('/nested/b'));
  act(() => router.navigate('/index'));

  expect(shadowDivergenceErrors()).toHaveLength(0);
});

it('stays silent for origin-targeted dispatches into a deep nested navigator', () => {
  // Nested navigation dispatches carry the origin navigator's key through `options.originKey`, which
  // the shadow must reduce with too (the envelope threads it). If the shadow dropped `originKey`, an
  // origin-targeted reduction would diverge and this would fire.
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'a/_layout': () => <Stack />,
    'a/index': () => <Text testID="a-index">A Index</Text>,
    'a/b/_layout': () => <Stack />,
    'a/b/index': () => <Text testID="ab-index">A B Index</Text>,
    'a/b/deep': () => <Text testID="ab-deep">A B Deep</Text>,
  });

  act(() => router.push('/a/b/index'));
  act(() => router.push('/a/b/deep'));
  act(() => router.setParams({ q: '1' }));

  expect(screen.getByTestId('ab-deep')).toBeVisible();
  expect(shadowDivergenceErrors()).toHaveLength(0);
});

it('fires the divergence assertion when the eager reduction is forced off the shadow', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  });

  // Force the eager (committed) path to attach a bogus param to the focused root route while the
  // shadow reduces the real tree. The two then genuinely differ (params) and the oracle must fire.
  const spy = jest
    .spyOn(rootReducerModule, 'rootReducer')
    .mockImplementation((state, action, registry, options) => {
      const real = rootReducerModule.reduceRoot(state, action, registry, options);
      const routes = real.state.routes.slice();
      const focused = routes[real.state.index]!;
      routes[real.state.index] = { ...focused, params: { ...focused.params, __divergent__: true } };
      return { ...real, state: { ...real.state, routes } };
    });

  act(() => router.push('/second'));

  expect(shadowDivergenceErrors().length).toBeGreaterThan(0);

  spy.mockRestore();
});
