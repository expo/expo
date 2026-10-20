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

function Capability() {
  return <Text testID="can-go-back">{String(useCanGoBack())}</Text>;
}

describe('Tabs', () => {
  it.each([
    { anchor: undefined, backBehavior: 'none' },
    { anchor: 'index', backBehavior: 'initialRoute' },
  ] as const)(
    'does not warn for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // A layout warns once per test file, so each case uses its own layout.
      await renderRouter(
        {
          [`(tabs-${backBehavior})/_layout`]: {
            unstable_settings: { anchor },
            default: () => (
              <Tabs backBehavior={backBehavior}>
                <Tabs.Screen name="index" />
                <Tabs.Screen name="second" />
              </Tabs>
            ),
          },
          [`(tabs-${backBehavior})/index`]: () => <Text>Index</Text>,
          [`(tabs-${backBehavior})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );
      expect(warn).not.toHaveBeenCalledWith(
        `Layout "./(tabs-${backBehavior})/_layout.js" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  );

  it('warns for an anchor with backBehavior none', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // A layout warns once per test file, so this test uses its own layout.
    await renderRouter(
      {
        '(tabs)/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Tabs backBehavior="none">
              <Tabs.Screen name="index" />
              <Tabs.Screen name="second" />
            </Tabs>
          ),
        },
        '(tabs)/index': () => <Text>Index</Text>,
        '(tabs)/second': () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(warn).toHaveBeenCalledWith(
      'Layout "./(tabs)/_layout.js" sets both `unstable_settings.anchor` and `backBehavior="none"`, ' +
        'so `useCanGoBack()` can return `true` on the first render. ' +
        'Remove the anchor or use a different `backBehavior`.'
    );
  });

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            <Tabs backBehavior="initialRoute">
              <Tabs.Screen name="index" />
              <Tabs.Screen name="second" />
            </Tabs>
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
  });
});

describe('Drawer', () => {
  it.each([
    { anchor: undefined, backBehavior: 'none' },
    { anchor: 'index', backBehavior: 'initialRoute' },
  ] as const)(
    'does not warn for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // A layout warns once per test file, so each case uses its own layout.
      await renderRouter(
        {
          [`(drawer-${backBehavior})/_layout`]: {
            unstable_settings: { anchor },
            default: () => (
              <Drawer backBehavior={backBehavior}>
                <Drawer.Screen name="index" />
                <Drawer.Screen name="second" />
              </Drawer>
            ),
          },
          [`(drawer-${backBehavior})/index`]: () => <Text>Index</Text>,
          [`(drawer-${backBehavior})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );
      expect(warn).not.toHaveBeenCalledWith(
        `Layout "./(drawer-${backBehavior})/_layout.js" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  );

  it('warns for an anchor with backBehavior none', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // A layout warns once per test file, so this test uses its own layout.
    await renderRouter(
      {
        '(drawer)/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Drawer backBehavior="none">
              <Drawer.Screen name="index" />
              <Drawer.Screen name="second" />
            </Drawer>
          ),
        },
        '(drawer)/index': () => <Text>Index</Text>,
        '(drawer)/second': () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(warn).toHaveBeenCalledWith(
      'Layout "./(drawer)/_layout.js" sets both `unstable_settings.anchor` and `backBehavior="none"`, ' +
        'so `useCanGoBack()` can return `true` on the first render. ' +
        'Remove the anchor or use a different `backBehavior`.'
    );
  });

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            <Drawer backBehavior="initialRoute">
              <Drawer.Screen name="index" />
              <Drawer.Screen name="second" />
            </Drawer>
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
  });
});

describe('NativeTabs', () => {
  it.each([
    { anchor: undefined, backBehavior: 'none' },
    { anchor: 'index', backBehavior: 'initialRoute' },
  ] as const)(
    'does not warn for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // A layout warns once per test file, so each case uses its own layout.
      await renderRouter(
        {
          [`(native-tabs-${backBehavior})/_layout`]: {
            unstable_settings: { anchor },
            default: () => (
              <NativeTabs backBehavior={backBehavior}>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="second" />
              </NativeTabs>
            ),
          },
          [`(native-tabs-${backBehavior})/index`]: () => <Text>Index</Text>,
          [`(native-tabs-${backBehavior})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );
      expect(warn).not.toHaveBeenCalledWith(
        `Layout "./(native-tabs-${backBehavior})/_layout.js" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  );

  it('warns for an anchor with backBehavior none', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // A layout warns once per test file, so this test uses its own layout.
    await renderRouter(
      {
        '(native-tabs)/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <NativeTabs backBehavior="none">
              <NativeTabs.Trigger name="index" />
              <NativeTabs.Trigger name="second" />
            </NativeTabs>
          ),
        },
        '(native-tabs)/index': () => <Text>Index</Text>,
        '(native-tabs)/second': () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(warn).toHaveBeenCalledWith(
      'Layout "./(native-tabs)/_layout.js" sets both `unstable_settings.anchor` and `backBehavior="none"`, ' +
        'so `useCanGoBack()` can return `true` on the first render. ' +
        'Remove the anchor or use a different `backBehavior`.'
    );
  });

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            <NativeTabs backBehavior="initialRoute">
              <NativeTabs.Trigger name="index" />
              <NativeTabs.Trigger name="second" />
            </NativeTabs>
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
  });
});

// Lazy screens are not preloaded, and a preload would also add the back history.
describe('TopTabs', () => {
  it.each([
    { anchor: undefined, backBehavior: 'none' },
    { anchor: 'index', backBehavior: 'initialRoute' },
  ] as const)(
    'does not warn for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // A layout warns once per test file, so each case uses its own layout.
      await renderRouter(
        {
          [`(top-tabs-${backBehavior})/_layout`]: {
            unstable_settings: { anchor },
            default: () => (
              <TopTabs backBehavior={backBehavior}>
                <TopTabs.Screen name="index" options={{ lazy: true }} />
                <TopTabs.Screen name="second" />
              </TopTabs>
            ),
          },
          [`(top-tabs-${backBehavior})/index`]: () => <Text>Index</Text>,
          [`(top-tabs-${backBehavior})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );
      expect(warn).not.toHaveBeenCalledWith(
        `Layout "./(top-tabs-${backBehavior})/_layout.js" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  );

  it('warns for an anchor with backBehavior none', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // A layout warns once per test file, so this test uses its own layout.
    await renderRouter(
      {
        '(top-tabs)/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <TopTabs backBehavior="none">
              <TopTabs.Screen name="index" options={{ lazy: true }} />
              <TopTabs.Screen name="second" />
            </TopTabs>
          ),
        },
        '(top-tabs)/index': () => <Text>Index</Text>,
        '(top-tabs)/second': () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(warn).toHaveBeenCalledWith(
      'Layout "./(top-tabs)/_layout.js" sets both `unstable_settings.anchor` and `backBehavior="none"`, ' +
        'so `useCanGoBack()` can return `true` on the first render. ' +
        'Remove the anchor or use a different `backBehavior`.'
    );
  });

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            <TopTabs backBehavior="initialRoute">
              <TopTabs.Screen name="index" options={{ lazy: true }} />
              <TopTabs.Screen name="second" />
            </TopTabs>
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
  });
});

describe('HeadlessTabs', () => {
  it.each([
    { anchor: undefined, backBehavior: 'none' },
    { anchor: 'index', backBehavior: 'initialRoute' },
  ] as const)(
    'does not warn for anchor=$anchor and backBehavior=$backBehavior',
    async ({ anchor, backBehavior }) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // A layout warns once per test file, so each case uses its own layout.
      await renderRouter(
        {
          [`(headless-tabs-${backBehavior})/_layout`]: {
            unstable_settings: { anchor },
            default: () => (
              <HeadlessTabs options={{ backBehavior }}>
                <TabSlot />
                <TabList>
                  <TabTrigger name="index" href="/" />
                  <TabTrigger name="second" href="/second" />
                </TabList>
              </HeadlessTabs>
            ),
          },
          [`(headless-tabs-${backBehavior})/index`]: () => <Text>Index</Text>,
          [`(headless-tabs-${backBehavior})/second`]: () => <Text>Second</Text>,
        },
        { initialUrl: '/second' }
      );
      expect(warn).not.toHaveBeenCalledWith(
        `Layout "./(headless-tabs-${backBehavior})/_layout.js" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  );

  it('warns for an anchor with backBehavior none', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // A layout warns once per test file, so this test uses its own layout.
    await renderRouter(
      {
        '(headless-tabs)/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <HeadlessTabs options={{ backBehavior: 'none' }}>
              <TabSlot />
              <TabList>
                <TabTrigger name="index" href="/" />
                <TabTrigger name="second" href="/second" />
              </TabList>
            </HeadlessTabs>
          ),
        },
        '(headless-tabs)/index': () => <Text>Index</Text>,
        '(headless-tabs)/second': () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(warn).toHaveBeenCalledWith(
      'Layout "./(headless-tabs)/_layout.js" sets both `unstable_settings.anchor` and `backBehavior="none"`, ' +
        'so `useCanGoBack()` can return `true` on the first render. ' +
        'Remove the anchor or use a different `backBehavior`.'
    );
  });

  it('adds back history after an initial deep link', async () => {
    await renderRouter(
      {
        _layout: () => (
          <>
            <Capability />
            <HeadlessTabs options={{ backBehavior: 'initialRoute' }}>
              <TabSlot />
              <TabList>
                <TabTrigger name="index" href="/" />
                <TabTrigger name="second" href="/second" />
              </TabList>
            </HeadlessTabs>
          </>
        ),
        index: () => <Text>Index</Text>,
        second: () => <Text>Second</Text>,
      },
      { initialUrl: '/second' }
    );
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
  });
});

it('reads the current stack during render', async () => {
  const { result } = await renderHook(() => useCanGoBack(), ['index', 'second']);
  expect(result.current).toBe(false);
  await act(() => router.push('/second'));
  expect(result.current).toBe(true);
  await act(() => router.back());
  expect(result.current).toBe(false);
});

it.each(['firstRoute', 'initialRoute', 'order'] as const)(
  'can go back with %s tabs after an unanchored initial deep link',
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

    expect(router.canGoBack()).toBe(true);
    expect(values[0]).toBe(false);
    expect(values.at(-1)).toBe(true);
  }
);

it.each(['history', 'fullHistory', 'none'] as const)(
  'cannot go back with %s tabs after an unanchored initial deep link',
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

    expect(router.canGoBack()).toBe(false);
    expect(values[0]).toBe(false);
    expect(values.at(-1)).toBe(false);
  }
);

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
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
    expect(router.canGoBack()).toBe(false);
    await act(toggle);
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
    expect(router.canGoBack()).toBe(true);
    await act(() => router.back());
    expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
    expect(router.canGoBack()).toBe(false);
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
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('true');
  expect(router.canGoBack()).toBe(true);
  await act(reorder);
  expect(screen.getByTestId('can-go-back')).toHaveTextContent('false');
  expect(router.canGoBack()).toBe(false);
  await act(reorder);
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
