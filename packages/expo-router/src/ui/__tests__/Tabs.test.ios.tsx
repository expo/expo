import { use, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, Text } from 'react-native';

import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { PreviewRouteContext } from '../../link/preview/PreviewRouteContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '../../react-navigation/native';
import { act, fireEvent, renderRouter, screen } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import { TabTriggerMapContext } from '../TabContext';
import type { TriggerMap } from '../common';
import { TabList, TabSlot, TabTrigger, Tabs } from '../index';

it('does not warn when the layout sets an anchor without a backBehavior', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  try {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Tabs>
              <TabList>
                <TabTrigger name="index" href="/" />
                <TabTrigger name="second" href="/second" />
              </TabList>
              <TabSlot />
            </Tabs>
          ),
        },
        index: () => <Text testID="index">Index</Text>,
        second: () => <Text testID="second">Second</Text>,
      },
      { initialUrl: '/second' }
    );

    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});

it('keeps static headless tab triggers stable while a stack covers the tabs', async () => {
  const triggerMaps: TriggerMap[] = [];
  const tabButtonRender = jest.fn();

  function Probe() {
    triggerMaps.push(use(TabTriggerMapContext));
    return null;
  }

  function TabButton({ label, ...props }: { label: string } & ComponentProps<typeof Pressable>) {
    tabButtonRender(label);
    return (
      <Pressable {...props}>
        <Text>{label}</Text>
      </Pressable>
    );
  }

  await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <TabList>
          <TabTrigger asChild name="home" href="/">
            <TabButton label="Home" />
          </TabTrigger>
          <TabTrigger asChild name="second" href="/second">
            <TabButton label="Second" />
          </TabTrigger>
        </TabList>
        <Probe />
        <TabSlot />
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="home">Home</Text>,
    '(tabs)/second': () => <Text testID="second">Second</Text>,
    details: () => <Text testID="details">Details</Text>,
    details2: () => <Text testID="details2">Details 2</Text>,
  });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(triggerMaps.at(-1)?.home?.href).toBe('/');
  expect(triggerMaps.at(-1)?.second?.href).toBe('/second');
  const originalMap = triggerMaps.at(-1);
  const originalButtonRenderCount = tabButtonRender.mock.calls.length;

  await act(() => router.push('/details'));
  expect(screen.getByTestId('details')).toBeVisible();
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(triggerMaps.at(-1)?.second?.href).toBe('/second');
  expect(tabButtonRender).toHaveBeenCalledTimes(originalButtonRenderCount);

  await act(() => router.push('/details2'));
  expect(screen.getByTestId('details2')).toBeVisible();
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(tabButtonRender).toHaveBeenCalledTimes(originalButtonRenderCount);

  await act(() => router.back());
  expect(screen.getByTestId('details')).toBeVisible();
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(tabButtonRender).toHaveBeenCalledTimes(originalButtonRenderCount);

  await act(() => router.back());
  expect(screen.getByTestId('home')).toBeVisible();
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(tabButtonRender).toHaveBeenCalledTimes(originalButtonRenderCount);
});

it('renders a stable screen layout with the current theme', async () => {
  let enableDarkTheme = () => {};

  function screenLayout({
    children,
    theme,
  }: {
    children: React.ReactElement;
    theme: ReactNavigation.Theme;
  }) {
    return (
      <>
        <Text testID="theme">{theme.dark ? 'dark' : 'light'}</Text>
        {children}
      </>
    );
  }

  function Layout() {
    const [dark, setDark] = useState(false);
    enableDarkTheme = () => setDark(true);
    return (
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <Tabs options={{ screenLayout }}>
          <TabList>
            <TabTrigger name="home" href="/" />
          </TabList>
          <TabSlot />
        </Tabs>
      </ThemeProvider>
    );
  }

  await renderRouter({
    _layout: Layout,
    index: () => <Text testID="home">Home</Text>,
  });

  expect(screen.getByTestId('theme')).toHaveTextContent('light');
  await act(() => enableDarkTheme());
  expect(screen.getByTestId('theme')).toHaveTextContent('dark');
});

it('updates relative triggers for their layout param but ignores unrelated params', async () => {
  const triggerMaps: TriggerMap[] = [];

  function Probe() {
    triggerMaps.push(use(TabTriggerMapContext));
    return null;
  }

  await renderRouter(
    {
      '[team]/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="home" href="./" />
            <TabTrigger name="settings" href="./settings" />
          </TabList>
          <Probe />
          <TabSlot />
        </Tabs>
      ),
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/settings': () => <Text testID="settings">Settings</Text>,
    },
    { initialUrl: '/alpha' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  expect(triggerMaps.at(-1)?.home?.href).toBe('/alpha/');
  expect(triggerMaps.at(-1)?.settings?.href).toBe('/alpha/settings');
  const originalMap = triggerMaps.at(-1);

  await act(() => router.setParams({ team: 'alpha' }));
  expect(triggerMaps.at(-1)).toBe(originalMap);

  await act(() => router.setParams({ noise: 'one' }));
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(triggerMaps.at(-1)?.settings?.href).toBe('/alpha/settings');

  await act(() => router.replace('/beta'));
  expect(screen.getByTestId('home')).toBeVisible();
  expect(triggerMaps.at(-1)).not.toBe(originalMap);
  expect(triggerMaps.at(-1)?.settings?.href).toBe('/beta/settings');
});

it('uses an updated layout param when a relative trigger is pressed without remounting', async () => {
  let setLayoutTeam: (team: string) => void = () => {};
  let layoutMounts = 0;
  const triggerMaps: TriggerMap[] = [];

  function Probe() {
    triggerMaps.push(use(TabTriggerMapContext));
    return null;
  }

  function Layout() {
    const navigation = useNavigation<{ setParams(params: { team: string }): void }>();
    setLayoutTeam = (team) => navigation.setParams({ team });
    useEffect(() => {
      layoutMounts++;
    }, []);
    return (
      <Tabs>
        <TabList>
          <TabTrigger name="home" href="./" />
          <TabTrigger name="settings" href="./settings" testID="settings-trigger" />
        </TabList>
        <Probe />
        <TabSlot />
      </Tabs>
    );
  }

  const result = await renderRouter(
    {
      '[team]/_layout': Layout,
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/settings': () => <Text testID="settings">Settings</Text>,
    },
    { initialUrl: '/alpha' }
  );

  expect(triggerMaps.at(-1)?.settings?.href).toBe('/alpha/settings');
  const initialMounts = layoutMounts;

  await act(() => setLayoutTeam('beta'));
  expect(layoutMounts).toBe(initialMounts);
  const hrefBeforePress = triggerMaps.at(-1)?.settings?.href;

  await act(() => fireEvent.press(screen.getByTestId('settings-trigger')));
  expect(screen.getByTestId('settings')).toBeVisible();
  expect(result.getPathname()).toBe('/beta/settings');
  expect(hrefBeforePress).toBe('/beta/settings');
});

it('resolves relative triggers from the layout when a child reuses its param name', async () => {
  const triggerMaps: TriggerMap[] = [];

  function Probe() {
    triggerMaps.push(use(TabTriggerMapContext));
    return null;
  }

  const result = await renderRouter(
    {
      '[team]/_layout': () => (
        <Tabs>
          <TabList>
            <TabTrigger name="home" href="./" />
            <TabTrigger name="details" href="./details" />
          </TabList>
          <Probe />
          <TabSlot />
        </Tabs>
      ),
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/details/_layout': () => <Stack />,
      '[team]/details/index': () => <Text testID="details">Details</Text>,
      '[team]/details/[team]': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/alpha' }
  );

  expect(triggerMaps.at(-1)?.details?.href).toBe('/alpha/details');

  await act(() => router.push('/alpha/details/beta'));
  expect(screen.getByTestId('child')).toBeVisible();
  expect(result.getSearchParams().team).toBe('beta');
  expect(triggerMaps.at(-1)?.details?.href).toBe('/alpha/details');
});

it('uses preview params for relative triggers without rebuilding for unrelated navigation', async () => {
  const triggerMaps: TriggerMap[] = [];

  function Probe() {
    triggerMaps.push(use(TabTriggerMapContext));
    return null;
  }

  await renderRouter(
    {
      '[team]/_layout': () => (
        <PreviewRouteContext.Provider
          value={{ pathname: '/preview', segments: ['[team]'], params: { team: 'preview' } }}>
          <Tabs>
            <TabList>
              <TabTrigger name="home" href="./" />
              <TabTrigger name="settings" href="./settings" />
            </TabList>
            <Probe />
            <TabSlot />
          </Tabs>
        </PreviewRouteContext.Provider>
      ),
      '[team]/index': () => <Text testID="home">Home</Text>,
      '[team]/settings': () => <Text testID="settings">Settings</Text>,
    },
    { initialUrl: '/alpha' }
  );

  expect(triggerMaps.at(-1)?.settings?.href).toBe('/preview/settings');
  const originalMap = triggerMaps.at(-1);

  await act(() => router.setParams({ noise: 'one' }));
  expect(triggerMaps.at(-1)).toBe(originalMap);
  expect(triggerMaps.at(-1)?.settings?.href).toBe('/preview/settings');
});
