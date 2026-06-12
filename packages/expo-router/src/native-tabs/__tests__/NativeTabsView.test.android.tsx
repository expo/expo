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
  { value: undefined, expected: false },
  { value: true, expected: true },
  { value: false, expected: false },
] as {
  value: NativeTabsProps['tabBarRespectsIMEInsets'];
  expected: NonNullable<TabsHostProps['android']>['tabBarRespectsIMEInsets'];
}[])('forwards tabBarRespectsIMEInsets=$value to Tabs.Host', ({ value, expected }) => {
  renderRouter({
    _layout: () => (
      <NativeTabs tabBarRespectsIMEInsets={value}>
        <NativeTabs.Trigger name="index" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsHost).toHaveBeenCalledTimes(1);
  expect(TabsHost.mock.calls[0][0].android?.tabBarRespectsIMEInsets).toBe(expected);
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

  it('forwards android raw props to Tabs.Host', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs unstable_nativeProps={{ android: { tabBarRespectsIMEInsets: true } }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].android).toMatchObject({
      tabBarRespectsIMEInsets: true,
    });
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

  it('does not let raw props override navStateRequest or onTabSelected', () => {
    const userOnTabSelected = jest.fn();
    const rawProps = {
      navStateRequest: { selectedScreenKey: 'foo', baseProvenance: 999 },
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
    expect(TabsHost.mock.calls[0][0].navStateRequest).toEqual({
      selectedScreenKey: expect.not.stringMatching('foo'),
      baseProvenance: 0,
    });
    expect(TabsHost.mock.calls[0][0].onTabSelected).not.toBe(userOnTabSelected);
    expect(TabsHost.mock.calls[0][0].onTabSelected).toBeInstanceOf(Function);
  });

  it('wires onTabSelectionPrevented onto Tabs.Host', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].onTabSelectionPrevented).toBeInstanceOf(Function);
  });

  it('drops ios-only raw props on Android so they do not leak onto Tabs.Host', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs unstable_nativeProps={{ ios: { tabBarTintColor: 'blue' }, direction: 'ltr' }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    // iOS-only raw props should not be forwarded to the Android host.
    expect(TabsHost.mock.calls[0][0].ios).toBeUndefined();
    expect(TabsHost.mock.calls[0][0].direction).toBe('ltr');
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

// TODO: drop this describe block once react-native-screens honors its documented
// fallback where `icon` is reused when `selectedIcon` is not provided.
describe('selectedIcon fallback', () => {
  it('mirrors drawable icon onto selectedIcon when no selected variant is provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon drawable="ic_home" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].android?.icon).toEqual({
      type: 'drawableResource',
      name: 'ic_home',
    });
    expect(TabsScreen.mock.calls[0][0].android?.selectedIcon).toEqual({
      type: 'drawableResource',
      name: 'ic_home',
    });
  });

  it('does not override an explicitly provided selectedIcon', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon
              drawable={{ default: 'ic_home', selected: 'ic_home_filled' }}
            />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].android?.icon).toEqual({
      type: 'drawableResource',
      name: 'ic_home',
    });
    expect(TabsScreen.mock.calls[0][0].android?.selectedIcon).toEqual({
      type: 'drawableResource',
      name: 'ic_home_filled',
    });
  });
});
