import { useEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import type { NavigationProp } from '../react-navigation/native';
import { act, renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

type Navigation =
  | ReturnType<typeof useNavigation<NavigationProp<ReactNavigation.RootParamList>>>
  | undefined;

it('can resolve the base navigator', async () => {
  let navigation: Navigation;

  await renderRouter({
    index: function Index() {
      navigation = useNavigation();

      return null;
    },
  });

  expect(navigation).toBeDefined();
  // This is the base navigator when there are no layout files
  expect(navigation?.getId()).toBe('/expo-router/build/views/Navigator');
});

it('can resolve the parent of a nested navigator', async () => {
  let navigation: Navigation;

  await renderRouter({
    _layout: () => <Stack />,
    '(app)/_layout': () => <Stack />,
    '(app)/index': function Index() {
      navigation = useNavigation();

      return null;
    },
  });

  expect(navigation).toBeDefined();
  // Narrows type for TypeScript
  if (!navigation) throw new Error('Expected navigation to be defined');
  expect(navigation.getId()).toBe('/(app)');
});

it('can resolve the root navigator', async () => {
  let navigation: Navigation;

  await renderRouter({
    index: function Index() {
      navigation = useNavigation();

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve the root navigator via "/"', async () => {
  let navigation: Navigation;

  await renderRouter({
    index: function Index() {
      navigation = useNavigation('/');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve the root navigator via "/" when nested', async () => {
  let navigation: Navigation;

  await renderRouter({
    '(a)/_layout': () => <Stack />,
    '(a)/(b)/_layout': () => <Stack />,
    '(a)/(b)/index': function Index() {
      navigation = useNavigation('/');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('');
});

it('can resolve a parent navigator via relative paths', async () => {
  let navigation: Navigation;

  await renderRouter({
    '(a)/_layout': () => <Stack />,
    '(a)/(b)/_layout': () => <Stack />,
    '(a)/(b)/index': function Index() {
      navigation = useNavigation('../');

      return null;
    },
    _layout: () => <Stack />,
  });

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('/(a)');
});

it('can resolve a parent navigator via missing groups', async () => {
  let navigation: Navigation;

  await renderRouter(
    {
      '(a)/_layout': () => <Stack />,
      '(a)/target/_layout': () => <Stack />,
      '(a)/target/(b)/_layout': () => <Stack />,
      '(a)/target/(b)/index': function Index() {
        navigation = useNavigation('/(a)/target');

        return null;
      },
      _layout: () => <Stack />,
    },
    {
      initialUrl: '/target',
    }
  );

  expect(navigation).toBeDefined();
  // This is the name of the root navigator
  expect(navigation?.getId()).toBe('/(a)/target');
});

it('works with hoisted routes and relative hrefs', async () => {
  let navigation: Navigation;

  await renderRouter(
    {
      '(a)/_layout': () => <Stack />,
      '(a)/hoisted/(b)/_layout': () => <Stack />,
      '(a)/hoisted/(b)/index': function Index() {
        navigation = useNavigation('../');

        return null;
      },
      _layout: () => <Stack />,
    },
    {
      initialUrl: '/hoisted',
    }
  );

  expect(navigation).toBeDefined();
  // Moving up one level should resolve to /(a) because this is the closest parent navigator
  expect(navigation?.getId()).toBe('/(a)');
});

describe('state listener', () => {
  const names = (state: { routes: { name: string }[] }) => state.routes.map((r) => r.name);

  // Calls `onState` with the route names from `getState()` and from the event.
  function useStateListener(onState: jest.Mock) {
    const navigation = useNavigation();
    useEffect(
      () =>
        navigation.addListener('state', (event: any) =>
          onState(names(navigation.getState()!), names(event.data.state))
        ),
      [navigation]
    );
  }

  function expectGetStateToMatchEvent(onState: jest.Mock) {
    for (const [fromGetState, fromEvent] of onState.mock.calls) {
      expect(fromGetState).toEqual(fromEvent);
    }
  }

  it('getState() matches event.data.state after a single navigation', async () => {
    const onState = jest.fn();

    await renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        useStateListener(onState);
        return <Text>Home</Text>;
      },
      detail: () => <Text>Detail</Text>,
    });
    await act(async () => router.push('/detail'));

    expect(onState).toHaveBeenLastCalledWith(['index', 'detail'], ['index', 'detail']);
    expectGetStateToMatchEvent(onState);
  });

  it('getState() matches event.data.state after multiple navigations', async () => {
    const onState = jest.fn();

    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text>Home</Text>,
      sheet: function Sheet() {
        useStateListener(onState);
        return <Text>Sheet</Text>;
      },
      detail: () => <Text>Detail</Text>,
    });
    await act(async () => router.push('/sheet'));
    await act(async () => router.navigate('/detail'));

    expect(onState).toHaveBeenLastCalledWith(
      ['index', 'sheet', 'detail'],
      ['index', 'sheet', 'detail']
    );
    expectGetStateToMatchEvent(onState);
  });

  it('getState() matches event.data.state in a nested navigator', async () => {
    const onState = jest.fn();

    await renderRouter({
      _layout: () => <Stack />,
      '(app)/_layout': () => <Stack />,
      '(app)/index': function Index() {
        useStateListener(onState);
        return <Text>Home</Text>;
      },
      '(app)/detail': () => <Text>Detail</Text>,
    });
    await act(async () => router.push('/detail'));

    expect(onState).toHaveBeenLastCalledWith(['index', 'detail'], ['index', 'detail']);
    expectGetStateToMatchEvent(onState);
  });

  it('getState() matches event.data.state with a non-index initialUrl', async () => {
    const onState = jest.fn();

    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text>Home</Text>,
        sheet: function Sheet() {
          useStateListener(onState);
          return <Text>Sheet</Text>;
        },
        detail: () => <Text>Detail</Text>,
      },
      { initialUrl: '/sheet' }
    );
    await act(async () => router.push('/detail'));

    expect(onState).toHaveBeenLastCalledWith(['sheet', 'detail'], ['sheet', 'detail']);
    expectGetStateToMatchEvent(onState);
  });
});
