import { screen } from '@testing-library/react-native';
import { View } from 'react-native';
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
  expected: TabsHostProps['tabBarControllerMode'];
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
  expect(TabsHost.mock.calls[0][0].tabBarControllerMode).toBe(expected);
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
  expect(TabsScreen.mock.calls[0][0].standardAppearance!.tabBarShadowColor).toBe('red');
  expect(TabsScreen.mock.calls[0][0].scrollEdgeAppearance!.tabBarShadowColor).toBe('transparent');
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
  expect(TabsScreen.mock.calls[0][0].standardAppearance!.tabBarShadowColor).toBe('red');
  expect(TabsScreen.mock.calls[0][0].scrollEdgeAppearance!.tabBarShadowColor).toBe('red');
});
