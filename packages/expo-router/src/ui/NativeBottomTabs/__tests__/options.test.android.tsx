import React from 'react';
import { View } from 'react-native';
import { BottomTabsScreen as _BottomTabsScreen } from 'react-native-screens';

import { screen, renderRouter } from '../../../testing-library';
import { NativeTabs } from '../NativeBottomTabsNavigator';
import type { NativeTabOptions } from '../NativeTabsView';
import { AndroidIcon, Badge, Icon, IOSIcon, Title } from '../NavigatorElements';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;

describe('Icons', () => {
  it('passes iconResourceName when using AndroidIcon on Android', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <AndroidIcon name="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'stairs',
    } as NativeTabOptions);
  });

  it('uses last AndroidIcon value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <AndroidIcon name="first" />
            <AndroidIcon name="second" />
            <AndroidIcon name="last" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      iconResourceName: 'last',
    } as NativeTabOptions);
  });

  it('does not pass iconResourceName when AndroidIcon is not used', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('iconResourceName');
  });

  // Currently not needed. Screens does not forbid this, as Icon does not work on Android yet.
  //   it('throws an error when mixing AndroidIcon and Icon', () => {
  //     expect(() =>
  //       renderRouter({
  //         _layout: () => (
  //           <NativeTabs>
  //             <NativeTabs.Trigger name="index">
  //               <Icon src={require('../../../../assets/file.png')} />
  //               <AndroidIcon name="stairs" />
  //             </NativeTabs.Trigger>
  //           </NativeTabs>
  //         ),
  //         index: () => <View testID="index" />,
  //       })
  //     ).toThrow('You can only use one type of icon (Icon or AndroidIcon) for a single tab');
  //   });

  it('does not set icon or selectedIcon when using IOSIcon on Android', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="homepod.2.fill" />
            <IOSIcon name="stairs" useAsSelected />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('icon');
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('selectedIcon');
  });
});
