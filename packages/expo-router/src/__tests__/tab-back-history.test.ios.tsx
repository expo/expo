import 'react-native-gesture-handler/jestSetup';
import { Profiler } from 'react';
import { Text } from 'react-native';

import { Drawer } from '../layouts/Drawer';
import Tabs from '../layouts/Tabs';
import { TopTabs } from '../layouts/TopTabs';
import { NativeTabs } from '../native-tabs/NativeTabs';
import { renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

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

it('writes back history for a Tabs deep link to a non-first tab', async () => {
  const result = await renderRouter(
    {
      _layout: () => (
        <Tabs backBehavior="initialRoute">
          <Tabs.Screen name="index" />
          <Tabs.Screen name="second" />
        </Tabs>
      ),
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index' },
    { type: 'route', key: 'second:0-0' },
  ]);
});

it('writes back history for a Tabs deep link that also creates the initial route', async () => {
  const result = await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'index' },
        default: () => (
          <Tabs backBehavior="initialRoute">
            <Tabs.Screen name="index" />
            <Tabs.Screen name="second" />
          </Tabs>
        ),
      },
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index:0-0' },
    { type: 'route', key: 'second:0-1' },
  ]);
});

it('writes back history for a Drawer deep link to a non-first screen', async () => {
  const result = await renderRouter(
    {
      _layout: () => (
        <Drawer backBehavior="initialRoute">
          <Drawer.Screen name="index" />
          <Drawer.Screen name="second" />
        </Drawer>
      ),
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index' },
    { type: 'route', key: 'second:0-0' },
  ]);
});

it('writes back history for a TopTabs deep link to a non-first tab', async () => {
  const result = await renderRouter(
    {
      _layout: () => (
        <TopTabs backBehavior="initialRoute">
          {/* A preload of `index` would also write history, so keep it lazy. */}
          <TopTabs.Screen name="index" options={{ lazy: true }} />
          <TopTabs.Screen name="second" />
        </TopTabs>
      ),
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index' },
    { type: 'route', key: 'second:0-0' },
  ]);
});

it('writes back history for a headless Tabs deep link to a non-first tab', async () => {
  const result = await renderRouter(
    {
      _layout: () => (
        <HeadlessTabs options={{ backBehavior: 'initialRoute' }}>
          <TabSlot />
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="second" href="/second" />
          </TabList>
        </HeadlessTabs>
      ),
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index' },
    { type: 'route', key: 'second:0-0' },
  ]);
});

it('writes back history for an anchored NativeTabs deep link to a non-first tab', async () => {
  const result = await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'index' },
        default: () => (
          <NativeTabs backBehavior="initialRoute">
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        ),
      },
      index: () => <Text>Index</Text>,
      second: () => <Text>Second</Text>,
    },
    { initialUrl: '/second' }
  );

  // The layout navigator is the first route of the root stack.
  expect(result.getRouterState()?.routes[0]?.state?.history).toEqual([
    { type: 'route', key: 'index:0-0' },
    { type: 'route', key: 'second:0-1' },
  ]);
});

it('does not render Tabs again when the first tab opens without a back target', async () => {
  const onRender = jest.fn();
  await renderRouter({
    _layout: () => (
      <Profiler id="tabs" onRender={onRender}>
        <Tabs backBehavior="initialRoute">
          <Tabs.Screen name="index" />
          <Tabs.Screen name="second" />
        </Tabs>
      </Profiler>
    ),
    index: () => <Text>Index</Text>,
    second: () => <Text>Second</Text>,
  });

  expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);
});
