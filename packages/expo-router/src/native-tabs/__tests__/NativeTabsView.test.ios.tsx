import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';
import {
  BottomTabs as _BottomTabs,
  type BottomTabsProps,
  type BottomTabsScreenProps,
} from 'react-native-screens';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { appendIconOptions } from '../NativeTabTrigger';
import { NativeTabs } from '../NativeTabs';
import { type NativeTabsTriggerIconProps } from '../common/elements';
import type { NativeTabOptions, NativeTabsProps } from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

const BottomTabs = _BottomTabs as jest.MockedFunction<typeof _BottomTabs>;

it.each([
  { value: undefined, expected: 'automatic' },
  { value: true, expected: 'tabSidebar' },
  { value: false, expected: 'tabBar' },
] as {
  value: NativeTabsProps['sidebarAdaptable'];
  expected: BottomTabsProps['tabBarControllerMode'];
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
  expect(BottomTabs).toHaveBeenCalledTimes(1);
  expect(BottomTabs.mock.calls[0][0].tabBarControllerMode).toBe(expected);
});
