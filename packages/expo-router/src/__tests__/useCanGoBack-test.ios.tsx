import 'react-native-gesture-handler/jestSetup';
import { act, screen } from '@testing-library/react-native';
import { act as reactAct, use, useState } from 'react';
import { Text } from 'react-native';

import { useCanGoBack } from '../exports';
import { router } from '../imperative-api';
import { Drawer } from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { TopTabs } from '../layouts/TopTabs';
import { NativeTabs } from '../native-tabs/NativeTabs';
import { DrawerActions } from '../react-navigation/routers/DrawerRouter';
import { renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';
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

afterEach(() => jest.restoreAllMocks());

const navigators = {
  Tabs: (backBehavior: 'none' | 'initialRoute') => (
    <Tabs backBehavior={backBehavior}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="second" />
    </Tabs>
  ),
  Drawer: (backBehavior: 'none' | 'initialRoute') => (
    <Drawer backBehavior={backBehavior}>
      <Drawer.Screen name="index" />
      <Drawer.Screen name="second" />
    </Drawer>
  ),
  NativeTabs: (backBehavior: 'none' | 'initialRoute') => (
    <NativeTabs backBehavior={backBehavior}>
      <NativeTabs.Trigger name="index" />
      <NativeTabs.Trigger name="second" />
    </NativeTabs>
  ),
  TopTabs: (backBehavior: 'none' | 'initialRoute') => (
    <TopTabs backBehavior={backBehavior}>
      {/* Lazy screens are not preloaded, and a preload would also add the back history. */}
      <TopTabs.Screen name="index" options={{ lazy: true }} />
      <TopTabs.Screen name="second" />
    </TopTabs>
  ),
  HeadlessTabs: (backBehavior: 'none' | 'initialRoute') => (
    <HeadlessTabs options={{ backBehavior }}>
      <TabSlot />
      <TabList>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="second" href="/second" />
      </TabList>
    </HeadlessTabs>
  ),
};

describe.each(Object.keys(navigators) as (keyof typeof navigators)[])('%s', (navigator) => {
  it.each([
    { anchor: 'index', backBehavior: 'none', warns: true },
    { anchor: undefined, backBehavior: 'none', warns: false },
    { anchor: 'index', backBehavior: 'initialRoute', warns: false },
  ] as const)(
    'warns only for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior, warns }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // The warning fires once per layout, so each navigator gets its own layout.
      await renderRouter(
        {
          [`(${navigator})/_layout`]: {
            unstable_settings: { anchor },
            default: () => navigators[navigator](backBehavior),
          },
          [`(${navigator})/index`]: () => <Text>Index</Text>,
          [`(${navigator})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );

      const warnings = warn.mock.calls.filter(([message]) =>
        String(message).startsWith(
          `Layout "./(${navigator})/_layout.js" sets both ` +
            '`unstable_settings.anchor` and `backBehavior="none"`, so `useCanGoBack()` can return `true` on the first render.'
        )
      );
      expect(warnings).toHaveLength(warns ? 1 : 0);
    }
  );

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            {navigators[navigator]('initialRoute')}
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expectCapability(true);
  });
});

it('reads the current stack during render', async () => {
  const values: boolean[] = [];
  function Screen() {
    values.push(useCanGoBack());
    return <Text>Screen</Text>;
  }

  await renderRouter({ _layout: () => <Stack />, index: Screen, second: Screen });
  expect(values[0]).toBe(false);
  expect(values.at(-1)).toBe(router.canGoBack());

  values.length = 0;
  await act(() => router.push('/second'));
  expect(values).toContain(true);
  expect(values.at(-1)).toBe(router.canGoBack());

  await act(() => router.back());
  expect(values.at(-1)).toBe(false);
  expect(values.at(-1)).toBe(router.canGoBack());
});

it.each(['firstRoute', 'initialRoute', 'order', 'history', 'fullHistory', 'none'] as const)(
  'matches the committed %s tab capability on an unanchored initial deep link',
  async (backBehavior) => {
    const values: boolean[] = [];
    function Layout() {
      values.push(useCanGoBack());
      return (
        <Tabs backBehavior={backBehavior}>
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

    expect(router.canGoBack()).toBe(['firstRoute', 'initialRoute', 'order'].includes(backBehavior));
    expect(values[0]).toBe(false);
    expect(values.at(-1)).toBe(router.canGoBack());
  }
);

function Capability() {
  return <Text testID="can-go-back">{String(useCanGoBack())}</Text>;
}

function expectCapability(expected: boolean) {
  expect(screen.getByTestId('can-go-back')).toHaveTextContent(String(expected));
  expect(router.canGoBack()).toBe(expected);
}

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
  expectCapability(false);
  await act(() => router.prefetch('/preloaded'));
  expectCapability(false);
  await act(() => router.navigate('/nested'));
  expectCapability(false);
  await act(() => router.push('/nested/second'));
  expectCapability(true);
  await act(() => router.navigate('/'));
  expectCapability(false);
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
  expectCapability(false);
  for (const href of ['/second', '/', '/second']) {
    await act(() => router.navigate(href));
    expectCapability(true);
  }
  for (const expected of [true, true, false]) {
    await act(() => router.back());
    expectCapability(expected);
  }
});

it.each(['open', 'closed'] as const)(
  'keeps drawer undo with backBehavior none and defaultStatus %s',
  async (defaultStatus) => {
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
          <Drawer backBehavior="none" defaultStatus={defaultStatus}>
            <Drawer.Screen name="index" />
          </Drawer>
        </>
      ),
      index: Index,
    });
    expectCapability(false);
    await act(toggle);
    expectCapability(true);
    await act(() => router.back());
    expectCapability(false);
  }
);

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
  expectCapability(false);
  await act(() => router.push('/modal'));
  expectCapability(true);
  await act(() => router.back());
  expectCapability(false);
});

it.each([false, true])(
  'keeps committed capability while a transition suspends (interrupted: %s)',
  async (interrupt) => {
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
    expectCapability(false);
    const transition = reactAct(() => router.push('/slow', { inTransition: true }));
    expectCapability(false);
    if (interrupt) {
      await act(() => router.replace('/other', { inTransition: false }));
      expectCapability(false);
    }
    await act(() => resolve('Slow'));
    await transition;
    expectCapability(true);
    expect(screen).toHavePathname(interrupt ? '/other' : '/slow');
  }
);

it('reconciles reordered tab declarations', async () => {
  let reorder!: () => void;
  function Layout() {
    const [reversed, setReversed] = useState(false);
    reorder = () => setReversed((value) => !value);
    return (
      <>
        <Capability />
        <Tabs backBehavior="firstRoute">
          {(reversed ? ['second', 'index'] : ['index', 'second']).map((name) => (
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
  expectCapability(true);
  await act(reorder);
  expectCapability(false);
  await act(reorder);
  expectCapability(true);
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
  expectCapability(true);
  await act(() => router.back());
  expect(screen).toHavePathname('/third');
  expectCapability(false);
});

it('does not re-render when root state changes without changing the value', async () => {
  let renders = 0;
  function Counter() {
    renders++;
    useCanGoBack();
    return null;
  }
  await renderRouter({
    _layout: () => (
      <>
        <Counter />
        <Stack />
      </>
    ),
    index: () => <Text>Index</Text>,
  });
  const initialRenders = renders;
  await act(() => router.setParams({ value: '1' }));
  expect(renders).toBe(initialRenders);
});
