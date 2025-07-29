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

it('can pass options via options prop', () => {
  const indexOptions: NativeTabOptions = {
    title: 'Test Title',
    tabBarItemIconColor: 'blue',
  };
  const secondOptions: NativeTabOptions = {
    title: 'Second Title',
    tabBarItemIconColor: 'red',
  };
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" options={{ ...indexOptions }} />
        <NativeTabs.Trigger name="second" options={{ ...secondOptions }} />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('second')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
  expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
    ...indexOptions,
  });
  expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
    ...secondOptions,
  });
});

it('can pass options via elements', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <IOSIcon name="homepod.2.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
  expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
    icon: { sfSymbolName: 'homepod.2.fill' },
  } as NativeTabOptions);
});

it('when no options are passed, default ones are used', () => {
  const { BottomTabsScreen } = require('react-native-screens');
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
  expect(Object.keys(BottomTabsScreen.mock.calls[0][0])).toEqual([
    'hidden',
    'specialEffects',
    'tabKey',
    'isFocused',
    'onWillAppear',
    'children',
  ]);
  expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
    hidden: false,
    specialEffects: {},
    tabKey: expect.stringMatching(/^index-[-\w]+/),
    isFocused: true,
    onWillAppear: expect.any(Function),
    children: expect.objectContaining({}),
  } as NativeTabOptions);
});

describe('Icons', () => {
  it('when using IOSIcon with name prop, it is passed as sfSymbolName', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="homepod.2.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      icon: { sfSymbolName: 'homepod.2.fill' },
    } as NativeTabOptions);
  });

  it('when using IOSIcon with useAsSelected prop, it is passed as selected icon sfSymbolName', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="homepod.2.fill" useAsSelected />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { sfSymbolName: 'homepod.2.fill' },
    } as NativeTabOptions);
  });

  it('when using IOSIcon with and without useAsSelected prop, value is passed correctly', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="stairs" />
            <IOSIcon name="homepod.2.fill" useAsSelected />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { sfSymbolName: 'homepod.2.fill' },
      icon: { sfSymbolName: 'stairs' },
    } as NativeTabOptions);
  });

  it('when using AndroidIcon on iOS, no value is passed', () => {
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
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('icon');
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('iconResourceName');
  });

  it('uses last IOSIcon value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="stairs" />
            <IOSIcon name="homepod.2.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      icon: { sfSymbolName: 'homepod.2.fill' },
    } as NativeTabOptions);
  });

  it('uses last IOSIcon with useAsSelected when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="stairs" useAsSelected />
            <IOSIcon name="homepod.2.fill" useAsSelected />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { sfSymbolName: 'homepod.2.fill' },
    } as NativeTabOptions);
  });

  it('uses last IOSIcon for each type when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <IOSIcon name="stairs" useAsSelected />
            <IOSIcon name="water.waves" useAsSelected />
            <IOSIcon name="homepod.2.fill" />
            <IOSIcon name="0.circle.ar" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { sfSymbolName: 'water.waves' },
      icon: { sfSymbolName: '0.circle.ar' },
    } as NativeTabOptions);
  });

  it('throws an error when Icon and IOSIcon are mixed with different useAsSelected', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Icon src={require('../../../../assets/file.png')} />
              <IOSIcon name="stairs" useAsSelected />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      })
    ).toThrow('You can only use one type of icon (Icon or IOSIcon) for a single tab');
  });

  it('throws an error when Icon and IOSIcon are mixed', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Icon src={require('../../../../assets/file.png')} />
              <IOSIcon name="stairs" />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      })
    ).toThrow('You can only use one type of icon (Icon or IOSIcon) for a single tab');
  });
});

describe('Badge', () => {
  it('passes badge value via Badge element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>5</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '5',
    } as NativeTabOptions);
  });

  it('passes badge value as string', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>New</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: 'New',
    } as NativeTabOptions);
  });

  it('does not pass badge when Badge is not used', () => {
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
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('badge');
  });

  it('uses last Badge value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>1</Badge>
            <Badge>2</Badge>
            <Badge>3</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '3',
    } as NativeTabOptions);
  });
});

describe('Title', () => {
  it('passes title via Title element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Title>Custom Title</Title>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Custom Title',
    } as NativeTabOptions);
  });

  it('does not pass title when Title is not used', () => {
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
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('title');
  });

  it('uses last Title value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Title>First Title</Title>
            <Title>Second Title</Title>
            <Title>Last Title</Title>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Last Title',
    } as NativeTabOptions);
  });
});
