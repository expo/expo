import { act, screen } from '@testing-library/react-native';
import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from 'react';
import { useState } from 'react';
import { Text } from 'react-native';

import Drawer from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import TopTabs from '../layouts/TopTabs';
import { NativeTabs } from '../native-tabs';
import { renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';

jest.mock('react-native-drawer-layout', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');

  return {
    ...actual,
    Drawer: ({ children }: ComponentProps<typeof actual.Drawer>) => <View>{children}</View>,
  };
});

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');

  return {
    ...actual,
    Tabs: {
      ...actual.Tabs,
      Host: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
      Screen: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    },
  };
});

let warnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('a guarded tab group that shares its URL with the fallback tab', () => {
  it('replaces the group with the fallback tab in bottom tabs', async () => {
    let setSignedIn: Dispatch<SetStateAction<boolean>>;

    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setState] = useState(true);
          setSignedIn = setState;
          return (
            <Tabs>
              <Tabs.Protected guard={signedIn}>
                <Tabs.Screen name="(app)" />
              </Tabs.Protected>
              <Tabs.Screen name="index" />
            </Tabs>
          );
        },
        index: () => <Text testID="login">Login</Text>,
        '(app)/_layout': () => <Stack />,
        '(app)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(app)' }
    );

    expect(screen.getByTestId('home')).toBeVisible();
    await act(() => setSignedIn(false));
    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces the group with the fallback tab in a drawer', async () => {
    let setSignedIn: Dispatch<SetStateAction<boolean>>;

    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setState] = useState(true);
          setSignedIn = setState;
          return (
            <Drawer>
              <Drawer.Protected guard={signedIn}>
                <Drawer.Screen name="(app)" />
              </Drawer.Protected>
              <Drawer.Screen name="index" />
            </Drawer>
          );
        },
        index: () => <Text testID="login">Login</Text>,
        '(app)/_layout': () => <Stack />,
        '(app)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(app)' }
    );

    expect(screen.getByTestId('home')).toBeVisible();
    await act(() => setSignedIn(false));
    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces the group with the fallback tab in top tabs', async () => {
    let setSignedIn: Dispatch<SetStateAction<boolean>>;

    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setState] = useState(true);
          setSignedIn = setState;
          return (
            <TopTabs>
              <TopTabs.Protected guard={signedIn}>
                <TopTabs.Screen name="(app)" />
              </TopTabs.Protected>
              <TopTabs.Screen name="index" />
            </TopTabs>
          );
        },
        index: () => <Text testID="login">Login</Text>,
        '(app)/_layout': () => <Stack />,
        '(app)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(app)' }
    );

    expect(screen.getByTestId('home')).toBeVisible();
    await act(() => setSignedIn(false));
    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces the group with the fallback tab in native tabs', async () => {
    let setSignedIn: Dispatch<SetStateAction<boolean>>;

    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setState] = useState(true);
          setSignedIn = setState;
          return (
            <NativeTabs>
              <Stack.Protected guard={signedIn}>
                <NativeTabs.Trigger name="(app)" />
              </Stack.Protected>
              <NativeTabs.Trigger name="index" />
            </NativeTabs>
          );
        },
        index: () => <Text testID="login">Login</Text>,
        '(app)/_layout': () => <Stack />,
        '(app)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(app)' }
    );

    expect(screen.getByTestId('home')).toBeVisible();
    await act(() => setSignedIn(false));
    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });
});

describe('a tab navigator with every tab guarded', () => {
  it('replaces bottom tabs with the parent fallback that shares their URL', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack />,
        },
        index: () => <Text testID="login">Login</Text>,
        '(tabs)/_layout': () => (
          <Tabs>
            <Tabs.Protected guard={false}>
              <Tabs.Screen name="index" />
            </Tabs.Protected>
          </Tabs>
        ),
        '(tabs)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(tabs)' }
    );

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen.queryByTestId('home')).toBeNull();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces a drawer with the parent fallback that shares its URL', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack />,
        },
        index: () => <Text testID="login">Login</Text>,
        '(tabs)/_layout': () => (
          <Drawer>
            <Drawer.Protected guard={false}>
              <Drawer.Screen name="index" />
            </Drawer.Protected>
          </Drawer>
        ),
        '(tabs)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(tabs)' }
    );

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen.queryByTestId('home')).toBeNull();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces top tabs with the parent fallback that shares their URL', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack />,
        },
        index: () => <Text testID="login">Login</Text>,
        '(tabs)/_layout': () => (
          <TopTabs>
            <TopTabs.Protected guard={false}>
              <TopTabs.Screen name="index" />
            </TopTabs.Protected>
          </TopTabs>
        ),
        '(tabs)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(tabs)' }
    );

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen.queryByTestId('home')).toBeNull();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });

  it('replaces native tabs with the parent fallback that shares their URL', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack />,
        },
        index: () => <Text testID="login">Login</Text>,
        '(tabs)/_layout': () => (
          <NativeTabs>
            <Stack.Protected guard={false}>
              <NativeTabs.Trigger name="index" />
            </Stack.Protected>
          </NativeTabs>
        ),
        '(tabs)/index': () => <Text testID="home">Home</Text>,
      },
      { initialUrl: '/(tabs)' }
    );

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen.queryByTestId('home')).toBeNull();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments([]);
  });
});

it('replaces a fully guarded navigator in headless tabs with the headless tabs fallback', async () => {
  await renderRouter(
    {
      _layout: () => (
        <HeadlessTabs>
          <TabList>
            <TabTrigger name="index" href="/" />
            <TabTrigger name="blocked" href="/blocked" />
          </TabList>
          <TabSlot />
        </HeadlessTabs>
      ),
      index: () => <Text testID="home">Home</Text>,
      'blocked/_layout': () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Screen name="index" />
          </Stack.Protected>
        </Stack>
      ),
      'blocked/index': () => <Text testID="blocked">Blocked</Text>,
    },
    { initialUrl: '/blocked' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen.queryByTestId('blocked')).toBeNull();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
});

it('warns when every tab is guarded and the fallback route has no tab', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Protected guard={false}>
          <Tabs.Screen name="index" />
        </Tabs.Protected>
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="home">Home</Text>,
    '(tabs)/settings': () => <Text testID="settings">Settings</Text>,
  });

  expect(warnSpy).toHaveBeenCalledWith(
    'Expo Router could not open the fallback route "settings" of a protected route in "/(tabs)", because every visible tab is protected and "settings" has no visible tab. ' +
      'Add a visible screen for "settings", or set `redirectTo` on the `Protected` component.'
  );
});
