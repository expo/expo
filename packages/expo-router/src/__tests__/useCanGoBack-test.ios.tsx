import 'react-native-gesture-handler/jestSetup';
import { act, screen } from '@testing-library/react-native';
import { act as reactAct, use, useState } from 'react';
import { Text } from 'react-native';

import { useCanGoBack } from '../exports';
import { renderHook } from '../hooks/__tests__/renderHook';
import { router } from '../imperative-api';
import { Drawer } from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { DrawerActions } from '../react-navigation/routers/DrawerRouter';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual: typeof import('react-native-drawer-layout') = jest.requireActual(
    'react-native-drawer-layout'
  );
  return {
    ...actual,
    Drawer: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

function Capability() {
  return <Text testID="can-go-back">{String(useCanGoBack())}</Text>;
}

it('reads the current stack during render', async () => {
  const { result } = await renderHook(() => useCanGoBack(), ['index', 'second']);
  expect(result.current).toBe(false);
  await act(() => router.push('/second'));
  expect(result.current).toBe(true);
  await act(() => router.back());
  expect(result.current).toBe(false);
});

it('can go back with firstRoute tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="firstRoute">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(true);
  expect(values.at(-1)).toBe(true);
});

it('can go back with initialRoute tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="initialRoute">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(true);
  expect(values.at(-1)).toBe(true);
});

it('can go back with order tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="order">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(true);
  expect(values.at(-1)).toBe(true);
});

it('cannot go back with history tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="history">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(false);
  expect(values[0]).toBe(false);
  expect(values.at(-1)).toBe(false);
});

it('cannot go back with fullHistory tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="fullHistory">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(false);
  expect(values[0]).toBe(false);
  expect(values.at(-1)).toBe(false);
});

it('cannot go back with none tabs after an unanchored initial deep link', async () => {
  const values: boolean[] = [];
  function Layout() {
    values.push(useCanGoBack());
    return (
      <Tabs backBehavior="none">
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    );
  }

  await renderRouter(
    {
      _layout: Layout,
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  expect(router.canGoBack()).toBe(false);
  expect(values[0]).toBe(false);
  expect(values.at(-1)).toBe(false);
});

it('ignores inactive tab stacks and preloaded screens', async () => {
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Tabs backBehavior="none">
          <Tabs.Screen name="index" />
          <Tabs.Screen name="nested" />
          <Tabs.Screen name="preloaded" />
        </Tabs>
      </>
    ),
    index: () => <Text>Index</Text>,
    'nested/_layout': () => <Stack />,
    'nested/index': () => <Text>Nested</Text>,
    preloaded: () => <Text>Preloaded</Text>,
    'nested/second': () => <Text>Second</Text>,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.prefetch('/preloaded'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.navigate('/nested'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.push('/nested/second'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.navigate('/'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('retains repeated fullHistory visits until each has been undone', async () => {
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Tabs backBehavior="fullHistory">
          <Tabs.Screen name="index" />
          <Tabs.Screen name="second" />
        </Tabs>
      </>
    ),
    index: () => <Text>Index</Text>,
    second: () => <Text>Second</Text>,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.navigate('/second'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.navigate('/'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.navigate('/second'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('keeps drawer undo with backBehavior none and defaultStatus open', async () => {
  let toggle!: () => void;
  function Index() {
    const navigation = useNavigation();
    toggle = () => navigation.dispatch(DrawerActions.toggleDrawer());
    return <Text>Index</Text>;
  }
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Drawer backBehavior="none" defaultStatus="open">
          <Drawer.Screen name="index" />
        </Drawer>
      </>
    ),
    index: Index,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(toggle);
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('keeps drawer undo with backBehavior none and defaultStatus closed', async () => {
  let toggle!: () => void;
  function Index() {
    const navigation = useNavigation();
    toggle = () => navigation.dispatch(DrawerActions.toggleDrawer());
    return <Text>Index</Text>;
  }
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Drawer backBehavior="none" defaultStatus="closed">
          <Drawer.Screen name="index" />
        </Drawer>
      </>
    ),
    index: Index,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(toggle);
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('reports the parent stack while a modal contains a root-only nested stack', async () => {
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Stack>
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </>
    ),
    index: () => <Text>Index</Text>,
    'modal/_layout': () => <Stack />,
    'modal/index': () => <Text>Modal</Text>,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.push('/modal'));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('keeps committed capability while a transition suspends', async () => {
  let resolve!: (value: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Stack />
      </>
    ),
    index: () => <Text>Index</Text>,
    slow: function Slow() {
      return <Text>{use(pending)}</Text>;
    },
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  const transition = reactAct(() => router.push('/slow', { inTransition: true }));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => resolve('Slow'));
  await transition;
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  expect(screen).toHavePathname('/slow');
});

it('keeps committed capability while an interrupted transition suspends', async () => {
  let resolve!: (value: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });
  await renderRouter({
    _layout: () => (
      <>
        <Capability />
        <Stack />
      </>
    ),
    index: () => <Text>Index</Text>,
    slow: function Slow() {
      return <Text>{use(pending)}</Text>;
    },
    other: () => <Text>Other</Text>,
  });
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  const transition = reactAct(() => router.push('/slow', { inTransition: true }));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => router.replace('/other', { inTransition: false }));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => resolve('Slow'));
  await transition;
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  expect(screen).toHavePathname('/other');
});

it('reconciles reordered tab declarations', async () => {
  let setNames!: (names: string[]) => void;
  function Layout() {
    const [names, setState] = useState(['index', 'second']);
    setNames = setState;
    return (
      <>
        <Capability />
        <Tabs backBehavior="firstRoute">
          {names.map((name) => (
            <Tabs.Screen key={name} name={name} />
          ))}
        </Tabs>
      </>
    );
  }
  await renderRouter(
    { _layout: Layout, index: () => <Text>Index</Text>, second: () => <Text>Second</Text> },
    { initialUrl: '/second' }
  );
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => setNames(['second', 'index']));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(() => setNames(['index', 'second']));
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
});

it('returns to an explicitly configured initial tab', async () => {
  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'third' },
        default: () => (
          <>
            <Capability />
            <Tabs backBehavior="initialRoute">
              <Tabs.Screen name="index" />
              <Tabs.Screen name="second" />
              <Tabs.Screen name="third" />
            </Tabs>
          </>
        ),
      },
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
      third: () => <Text>Third</Text>,
    },
    { initialUrl: '/second' }
  );
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(() => router.back());
  expect(screen).toHavePathname('/third');
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
});

it('does not re-render when root state changes without changing the value', async () => {
  let renders = 0;
  await renderHook(() => {
    renders++;
    return useCanGoBack();
  });
  const initialRenders = renders;
  await act(() => router.setParams({ value: '1' }));
  expect(renders).toBe(initialRenders);
});
