import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';
import { Tabs, type TabsHostProps } from 'react-native-screens';

import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import type { NativeTabsProps } from '../types';

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

const TabsHost = Tabs.Host as jest.MockedFunction<typeof Tabs.Host>;
const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

it.each([
  { value: undefined, expected: 'automatic' },
  { value: true, expected: 'tabSidebar' },
  { value: false, expected: 'tabBar' },
] as {
  value: NativeTabsProps['sidebarAdaptable'];
  expected: NonNullable<TabsHostProps['ios']>['tabBarControllerMode'];
}[])('when sidebarAdaptable is $value, then ', ({ value, expected }) => {
  renderRouter({
    _layout: () => (
      <NativeTabs sidebarAdaptable={value}>
        <NativeTabs.Trigger name="index" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsHost).toHaveBeenCalledTimes(1);
  expect(TabsHost.mock.calls[0][0].ios?.tabBarControllerMode).toBe(expected);
});

it('uses shadowColor when it is passed to NativeTabs', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs shadowColor="red">
        <NativeTabs.Trigger name="index" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsScreen).toHaveBeenCalledTimes(1);
  expect(TabsScreen.mock.calls[0][0].ios?.standardAppearance!.tabBarShadowColor).toBe('red');
  expect(TabsScreen.mock.calls[0][0].ios?.scrollEdgeAppearance!.tabBarShadowColor).toBe(
    'transparent'
  );
});

it('uses shadowColor when it is passed to NativeTabs in both standardAppearance and scrollEdgeAppearance when disableTransparentOnScrollEdge is true', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs shadowColor="red" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger name="index" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsScreen).toHaveBeenCalledTimes(1);
  expect(TabsScreen.mock.calls[0][0].ios?.standardAppearance!.tabBarShadowColor).toBe('red');
  expect(TabsScreen.mock.calls[0][0].ios?.scrollEdgeAppearance!.tabBarShadowColor).toBe('red');
});

describe('unstable_nativeProps', () => {
  it('forwards top-level raw props to Tabs.Host', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs unstable_nativeProps={{ colorScheme: 'dark', direction: 'rtl' }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].colorScheme).toBe('dark');
    expect(TabsHost.mock.calls[0][0].direction).toBe('rtl');
  });

  it('merges ios raw props with expo-router-managed ios props', () => {
    const onMoreTabSelected = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs tintColor="red" unstable_nativeProps={{ ios: { onMoreTabSelected } }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].ios).toMatchObject({
      tabBarTintColor: 'red',
      onMoreTabSelected,
    });
  });

  it('lets ios raw props override expo-router-managed ios props', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs tintColor="red" unstable_nativeProps={{ ios: { tabBarTintColor: 'blue' } }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].ios?.tabBarTintColor).toBe('blue');
  });

  it('lets top-level raw props override expo-router-managed props', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs hidden unstable_nativeProps={{ tabBarHidden: false }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].tabBarHidden).toBe(false);
  });

  it('does not let raw props override navState or onTabSelected', () => {
    const userOnTabSelected = jest.fn();
    // Cast to bypass the type — navState/onTabSelected are intentionally excluded
    // from NativeTabsHostNativeProps, but a user could still pass them at runtime.
    const rawProps = {
      navState: { selectedScreenKey: 'foo', provenance: 999 },
      onTabSelected: userOnTabSelected,
    } as unknown as NativeTabsProps['unstable_nativeProps'];
    renderRouter({
      _layout: () => (
        <NativeTabs unstable_nativeProps={rawProps}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    // navState should be the router-managed one (initial provenance is 0, screenKey is the route key, not "foo")
    expect(TabsHost.mock.calls[0][0].navState).toEqual({
      selectedScreenKey: expect.not.stringMatching('foo'),
      provenance: 0,
    });
    // onTabSelected should be the router-managed handler, not the user's spy
    expect(TabsHost.mock.calls[0][0].onTabSelected).not.toBe(userOnTabSelected);
    expect(TabsHost.mock.calls[0][0].onTabSelected).toBeInstanceOf(Function);
  });

  it('drops android-only raw props on iOS so they do not leak onto Tabs.Host', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs
          unstable_nativeProps={{ android: { tabBarRespectsIMEInsets: true }, direction: 'ltr' }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    // Android-only raw props should not be forwarded to the iOS host.
    expect(TabsHost.mock.calls[0][0].android).toBeUndefined();
    expect(TabsHost.mock.calls[0][0].direction).toBe('ltr');
  });

  it('warns in dev when ios.bottomAccessory raw prop collides with <NativeTabs.BottomAccessory> child', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      renderRouter({
        _layout: () => (
          <NativeTabs unstable_nativeProps={{ ios: { bottomAccessory: () => null } }}>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.BottomAccessory>
              <View testID="accessory" />
            </NativeTabs.BottomAccessory>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<NativeTabs.BottomAccessory> is being overridden')
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('forwards updated raw props to Tabs.Host on re-render', () => {
    function Layout() {
      const [direction, setDirection] = React.useState<'ltr' | 'rtl'>('ltr');
      return (
        <>
          <Button testID="toggle" title="Toggle" onPress={() => setDirection('rtl')} />
          <NativeTabs unstable_nativeProps={{ direction }}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        </>
      );
    }

    renderRouter({
      _layout: Layout,
      index: () => <View testID="index" />,
    });

    expect(TabsHost.mock.calls.at(-1)![0].direction).toBe('ltr');

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(TabsHost.mock.calls.at(-1)![0].direction).toBe('rtl');
  });
});
