import { screen, fireEvent } from '@testing-library/react-native';
import { act, useEffect, useState, type ReactNode } from 'react';
import { Button, View } from 'react-native';
import { Tabs, type TabsHostProps, type TabsScreenProps } from 'react-native-screens';

import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { Link } from '../../link/Link';
import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    ScreenStackItem: jest.fn(({ children }) => <View>{children}</View>),
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

const TabsScreen = Tabs.Screen as jest.MockedFunction<(props: TabsScreenProps) => ReactNode>;
const TabsHost = Tabs.Host as jest.MockedFunction<(props: TabsHostProps) => ReactNode>;

afterEach(() => router.setTransitionMode('preload-only'));

function renderedScreenKeys() {
  return TabsScreen.mock.calls.map((call) => call[0].screenKey);
}

function settingsTitle() {
  return TabsScreen.mock.calls.find((call) => call[0].screenKey === 'settings')?.[0].title;
}

describe('NativeTabs Protected', () => {
  it('shows a trigger wrapped in Stack.Protected when guard is true', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <Stack.Protected guard>
            <NativeTabs.Trigger name="settings">
              <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </Stack.Protected>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <Link href="/settings" testID="open-settings" />
        </View>
      ),
      settings: () => <View testID="settings" />,
    });

    expect(renderedScreenKeys()).toContain('settings');
    expect(settingsTitle()).toBe('Settings');
    expect(screen.getByTestId('settings')).toBeVisible();

    await act(() => router.setTransitionMode('always'));
    TabsScreen.mockClear();
    await act(() => fireEvent.press(screen.getByTestId('open-settings')));

    expect(screen).toHavePathname('/settings');
    expect(screen.getByTestId('settings')).toBeVisible();
    expect(TabsHost.mock.calls.at(-1)?.[0].navStateRequest?.selectedScreenKey).toBe('settings');
  });

  it('hides a guarded trigger and redirects to redirectTo', async () => {
    await renderRouter(
      {
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="about" />
            <Stack.Protected guard={false} redirectTo="/about">
              <NativeTabs.Trigger name="settings" />
            </Stack.Protected>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        about: () => <View testID="about" />,
        settings: () => <View testID="settings" />,
      },
      { initialUrl: '/settings' }
    );

    expect(renderedScreenKeys()).not.toContain('settings');
    expect(screen.queryByTestId('settings')).toBeNull();
    expect(screen.getByTestId('about')).toBeVisible();
    expect(screen).toHavePathname('/about');
  });

  it('shows a passing nested guard and hides a failing nested guard', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <Stack.Protected guard>
            <NativeTabs.Trigger name="settings" />
            <Stack.Protected guard={false} redirectTo="/settings">
              <NativeTabs.Trigger name="admin" />
            </Stack.Protected>
          </Stack.Protected>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <Link href="/admin" testID="open-admin" />
        </View>
      ),
      settings: () => <View testID="settings" />,
      admin: () => <View testID="admin" />,
    });

    expect(renderedScreenKeys()).toContain('settings');
    expect(renderedScreenKeys()).not.toContain('admin');
    expect(screen.getByTestId('settings')).toBeVisible();
    expect(screen.queryByTestId('admin')).toBeNull();

    await act(() => router.setTransitionMode('always'));
    await act(() => fireEvent.press(screen.getByTestId('open-admin')));

    expect(screen).toHavePathname('/settings');
    expect(screen.queryByTestId('admin')).toBeNull();
  });

  it('hides a hidden trigger inside Stack.Protected when guard is true', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <Stack.Protected guard>
            <NativeTabs.Trigger name="settings" hidden />
          </Stack.Protected>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      settings: () => <View testID="settings" />,
    });

    expect(renderedScreenKeys()).not.toContain('settings');
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('settings')).toBeNull();
  });

  it('shows the trigger after the guard flips to true', async () => {
    const onMount = jest.fn();

    function ScreenWithMount({ testID }: { testID: string }) {
      useEffect(() => {
        onMount(testID);
      }, []);
      return <View testID={testID} />;
    }

    await renderRouter({
      _layout: function Layout() {
        const [allowed, setAllowed] = useState(false);
        return (
          <>
            <Button testID="allow" title="Allow" onPress={() => setAllowed(true)} />
            <NativeTabs>
              <NativeTabs.Trigger name="index" />
              <Stack.Protected guard={allowed}>
                <NativeTabs.Trigger name="settings" />
              </Stack.Protected>
            </NativeTabs>
          </>
        );
      },
      index: () => <ScreenWithMount testID="index" />,
      settings: () => <ScreenWithMount testID="settings" />,
    });

    expect(renderedScreenKeys()).not.toContain('settings');
    expect(screen.queryByTestId('settings')).toBeNull();
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onMount).toHaveBeenCalledWith('index');

    onMount.mockClear();
    TabsScreen.mockClear();
    await act(() => fireEvent.press(screen.getByTestId('allow')));

    expect(renderedScreenKeys()).toContain('settings');
    expect(screen.getByTestId('settings')).toBeVisible();
    // The visible tab set changed, so the native host remounts, the same as `hidden`.
    expect(onMount).toHaveBeenCalledWith('index');
    expect(onMount).toHaveBeenCalledWith('settings');
  });
});
