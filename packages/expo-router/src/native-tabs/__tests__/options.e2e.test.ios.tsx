import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';
import {
  BottomTabsScreen as _BottomTabsScreen,
  type BottomTabsScreenProps,
} from 'react-native-screens';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { appendIconOptions } from '../NativeTabTrigger';
import { NativeTabs } from '../NativeTabs';
import {
  type DrawableIcon,
  type MaterialIcon,
  type NativeTabsTriggerIconProps,
  type SFSymbolIcon,
  type SrcIcon,
} from '../common/elements';
import type { NativeTabOptions } from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;

it('can pass props via unstable_nativeProps', () => {
  const indexOptions = {
    title: 'Test Title',
    iconColor: 'blue',
  };
  const secondOptions = {
    title: 'Second Title',
    iconColor: 'red',
  };
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" unstable_nativeProps={{ ...indexOptions }} />
        <NativeTabs.Trigger name="second" unstable_nativeProps={{ ...secondOptions }} />
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
          <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
  expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
    icon: { ios: { type: 'sfSymbol', name: 'homepod.2.fill' } },
    selectedIcon: undefined,
  } as BottomTabsScreenProps);
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
  expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
    hidden: false,
    specialEffects: {},
    tabKey: expect.stringMatching(/^index-[-\w]+/),
    isFocused: true,
    children: expect.objectContaining({}),
    icon: undefined,
    selectedIcon: undefined,
    freezeContents: false,
  } as BottomTabsScreenProps);
});

describe('Icons', () => {
  it('when using Icon with sf prop, it is passed as sfSymbolName', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      icon: { ios: { type: 'sfSymbol', name: 'homepod.2.fill' } },
    } as BottomTabsScreenProps);
  });

  it('when using Icon with sf selected prop, it is passed as selected icon sfSymbolName', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ selected: 'homepod.2.fill' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { type: 'sfSymbol', name: 'homepod.2.fill' },
    } as BottomTabsScreenProps);
  });

  it('when using Icon with sf object, values are passed correctly', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { type: 'sfSymbol', name: 'star.bubble' },
      icon: { ios: { type: 'sfSymbol', name: 'stairs' } },
    } as BottomTabsScreenProps);
  });

  it('when using Icon drawable on iOS, no value is passed', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon drawable="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].icon).toBeUndefined();
    expect(BottomTabsScreen.mock.calls[0][0].selectedIcon).toBeUndefined();
  });

  it('uses last Icon sf value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf="stairs" />
            <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      icon: { ios: { type: 'sfSymbol', name: 'homepod.2.fill' } },
      selectedIcon: undefined,
    } as BottomTabsScreenProps);
  });

  it('uses last Icon sf selected when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ selected: 'stairs' }} />
            <NativeTabs.Trigger.Icon sf={{ selected: 'homepod.2.fill' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { type: 'sfSymbol', name: 'homepod.2.fill' },
    } as BottomTabsScreenProps);
  });

  it('uses last Icon sf for each type when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
            <NativeTabs.Trigger.Icon
              sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }}
            />
            <NativeTabs.Trigger.Icon sf="0.circle.ar" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: undefined,
      icon: { ios: { type: 'sfSymbol', name: '0.circle.ar' } },
    } as BottomTabsScreenProps);
  });

  it('uses last Icon sf for each type when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
            <NativeTabs.Trigger.Icon
              sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }}
            />
            <NativeTabs.Trigger.Icon sf={{ selected: '0.circle.ar' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      selectedIcon: { type: 'sfSymbol', name: '0.circle.ar' },
      icon: undefined,
    } as BottomTabsScreenProps);
  });

  it('when selectedIconColor is provided, it is passed to screen', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs iconColor={{ selected: 'red' }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemIconColor: 'red',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
  });

  it('when selectedIconColor is provided in container and tab, the tab should use the tab color', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs iconColor={{ selected: 'red' }}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon selectedColor="blue" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemIconColor: 'blue',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemIconColor: 'red',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
  });

  it.each([
    { expectedIcon: undefined },
    { sf: '0.circle', expectedIcon: { type: 'sfSymbol', name: '0.circle' } },
    {
      sf: '0.circle',
      src: { uri: 'some-uri' },
      expectedIcon: { type: 'sfSymbol', name: '0.circle' },
    },
    {
      sf: '0.circle',
      src: { uri: 'some-uri' },
      drawable: 'ic_some_drawable',
      expectedIcon: { type: 'sfSymbol', name: '0.circle' },
    },
    {
      sf: '0.circle',
      src: { uri: 'some-uri' },
      material: 'ic_some_drawable',
      expectedIcon: { type: 'sfSymbol', name: '0.circle' },
    },
    {
      src: { uri: 'some-uri' },
      expectedIcon: { type: 'templateSource', templateSource: { uri: 'some-uri' } },
    },
    {
      src: { uri: 'some-uri' },
      drawable: 'ic_some_drawable',
      expectedIcon: { type: 'templateSource', templateSource: { uri: 'some-uri' } },
    },
    {
      src: { uri: 'some-uri' },
      material: 'ic_some_drawable',
      expectedIcon: { type: 'templateSource', templateSource: { uri: 'some-uri' } },
    },
  ] as (DrawableIcon &
    MaterialIcon &
    SrcIcon &
    SFSymbolIcon & {
      expectedIcon: BottomTabsScreenProps['icon']['ios'];
    })[])(
    'For <Icon sf="$sf" src="$src" drawable="$drawable">, icon is $expectedIcon',
    ({ sf, src, drawable, material, expectedIcon }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Icon sf={sf} material={material} src={src} drawable={drawable} />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
      expect(BottomTabsScreen.mock.calls[0][0].icon?.ios).toEqual(expectedIcon);
    }
  );
});

describe('Badge', () => {
  it('passes badge value via Badge element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '5',
    } as BottomTabsScreenProps);
  });

  it('passes badge value as string', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Badge>New</NativeTabs.Trigger.Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: 'New',
    } as BottomTabsScreenProps);
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
    expect(BottomTabsScreen.mock.calls[0][0]).not.toHaveProperty('badgeValue');
  });

  it('uses last Badge value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Badge>2</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '3',
    } as BottomTabsScreenProps);
  });

  it('when empty Badge is used, passes space to badgeValue', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Badge />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].badgeValue).toBe(' '); // Space is used to show empty badge
  });

  it('when empty Badge is used with hidden, passes undefined to badgeValue', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Badge hidden />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].badgeValue).toBeUndefined();
  });
});

describe('Label', () => {
  it('passes title via Label element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Custom Title',
    } as BottomTabsScreenProps);
  });

  it('when title is not set, uses the route name', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('one')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].title).toBe('index');
    expect(BottomTabsScreen.mock.calls[1][0].title).toBe('one');
  });

  it('uses last Label value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>First Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Label>Second Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Label>Last Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Last Title',
    } as BottomTabsScreenProps);
  });

  it('when empty Label is used, passes route name to title', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].title).toBe('index'); // Route name is used as title when Label is empty
  });

  it('when Label with hidden is used, passes empty string to title', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label hidden />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0].title).toBe(''); // Route name is used as title when Label is empty
  });

  it('when selectedLabelStyle is provided, it is passed to screen', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs labelStyle={{ selected: { fontSize: 24, color: 'red' } }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemTitleFontSize: 24,
            tabBarItemTitleFontColor: 'red',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
  });

  it('when selectedLabelStyle is provided in container and tab, the tab should use the tab color', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs labelStyle={{ selected: { fontSize: 24, color: 'red' } }}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label selectedStyle={{ fontSize: 32, color: 'blue' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemTitleFontSize: 32,
            tabBarItemTitleFontColor: 'blue',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      standardAppearance: {
        stacked: {
          selected: {
            tabBarItemTitleFontSize: 24,
            tabBarItemTitleFontColor: 'red',
          },
        },
      },
    } as Partial<BottomTabsScreenProps>);
  });
});

describe('Tab options', () => {
  describe('disablePopToTop', () => {
    it('When disablePopToTop is true, popToRoot is false', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disablePopToTop>
              <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
      expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: false,
          },
        },
      } as BottomTabsScreenProps);
    });

    it('When disablePopToTop is not set or false, popToRoot is true', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="one" disablePopToTop={false}>
              <NativeTabs.Trigger.Label>One</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        one: () => <View testID="one" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
      expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as BottomTabsScreenProps);
      expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as BottomTabsScreenProps);
    });
  });

  describe('disableScrollToTop', () => {
    it('When disableScrollToTop is true, scrollToTop is false', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disableScrollToTop>
              <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
      expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: false,
          },
        },
      } as BottomTabsScreenProps);
    });

    it('When disableScrollToTop is not set or false, scrollToTop is true', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Label>Custom Title</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="one" disableScrollToTop={false}>
              <NativeTabs.Trigger.Label>One</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        one: () => <View testID="one" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
      expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as BottomTabsScreenProps);
      expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as BottomTabsScreenProps);
    });
  });
});

describe('Dynamic options', () => {
  it('updates nativeProps dynamically', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_nativeProps={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" unstable_nativeProps={{ title: 'Updated Title' }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      children: expect.objectContaining({}),
      freezeContents: false,
      icon: undefined,
      selectedIcon: undefined,
    } as BottomTabsScreenProps);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      children: expect.objectContaining({}),
      freezeContents: false,
      icon: undefined,
      selectedIcon: undefined,
    } as BottomTabsScreenProps);
  });

  it('unstable_nativeProps override dynamic options configuration', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_nativeProps={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Updated Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      icon: undefined,
      selectedIcon: undefined,
      freezeContents: false,
    } as BottomTabsScreenProps);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      badgeValue: '5',
      icon: {
        ios: {
          type: 'sfSymbol',
          name: 'homepod.2.fill',
        },
      },
      selectedIcon: undefined,
      freezeContents: false,
    } as BottomTabsScreenProps);
  });

  it('can override component children from _layout with unstable_nativeProps', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon sf="0.circle" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger
            name="index"
            unstable_nativeProps={{
              title: 'Updated Title',
              badgeValue: '5',
              icon: {
                ios: { type: 'sfSymbol', name: 'homepod.2.fill' },
              },
            }}
          />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      icon: {
        ios: {
          type: 'sfSymbol',
          name: '0.circle',
        },
      },
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
    } as BottomTabsScreenProps);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      badgeValue: '5',
      icon: {
        ios: {
          type: 'sfSymbol',
          name: 'homepod.2.fill',
        },
      },
    } as BottomTabsScreenProps);
  });

  it('can override component children from _layout with dynamic children', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon sf="0.circle" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Updated Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      icon: {
        ios: {
          type: 'sfSymbol',
          name: '0.circle',
        },
      },
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
    } as BottomTabsScreenProps);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      badgeValue: '5',
      icon: {
        ios: {
          type: 'sfSymbol',
          name: 'homepod.2.fill',
        },
      },
    } as BottomTabsScreenProps);
  });

  it('can dynamically update options with state update', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: function Index() {
        const [value, setValue] = React.useState(0);
        const label = `Updated Title ${value}`;
        return (
          <View testID="index">
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <Button title="Update" testID="update-button" onPress={() => setValue((v) => v + 1)} />
          </View>
        );
      },
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].title).toBe('Initial Title');
    expect(BottomTabsScreen.mock.calls[1][0].title).toBe('Updated Title 0');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(BottomTabsScreen).toHaveBeenCalledTimes(3);
    expect(BottomTabsScreen.mock.calls[2][0].title).toBe('Updated Title 1');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(BottomTabsScreen).toHaveBeenCalledTimes(4);
    expect(BottomTabsScreen.mock.calls[3][0].title).toBe('Updated Title 2');
  });

  it('can be used in preview', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="second">
            <NativeTabs.Trigger.Label>Second</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <HrefPreview href="/second" />
        </View>
      ),
      second: () => (
        <View testID="second">
          <NativeTabs.Trigger name="second">
            <NativeTabs.Trigger.Label>Updated Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    // Tab + preview
    expect(screen.getAllByTestId('second')).toHaveLength(2);
    expect(within(screen.getByTestId('index')).getByTestId('second')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^index-[-\w]+/),
      isFocused: true,
      icon: undefined,
      selectedIcon: undefined,
      freezeContents: false,
    } as BottomTabsScreenProps);
    expect(BottomTabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Second',
      hidden: false,
      specialEffects: {},
      tabKey: expect.stringMatching(/^second-[-\w]+/),
      isFocused: false,
      icon: undefined,
      selectedIcon: undefined,
      freezeContents: false,
    } as BottomTabsScreenProps);
  });
});

describe(appendIconOptions, () => {
  const ICON_FAMILY = {
    getImageSource: (name: 'a' | 'b' | 'c') => Promise.resolve({ uri: name }),
  };
  it.each([
    [{}, {}],
    [{ sf: '0.circle' }, { icon: { sf: '0.circle' }, selectedIcon: undefined }],
    [
      { sf: { default: '0.circle', selected: 'o.circle.fill' } },
      { icon: { sf: '0.circle' }, selectedIcon: { sf: 'o.circle.fill' } },
    ],
    [
      { sf: { selected: 'o.circle.fill' } },
      { icon: undefined, selectedIcon: { sf: 'o.circle.fill' } },
    ],
    [
      { src: { uri: 'xxx', scale: 2 } },
      { icon: { src: { uri: 'xxx', scale: 2 } }, selectedIcon: undefined },
    ],
    [
      { src: { default: 'xxx', selected: 'yyy' } },
      { icon: { src: 'xxx' }, selectedIcon: { src: 'yyy' } },
    ],
    [
      {
        sf: '0.circle',
        src: <NativeTabs.Trigger.VectorIcon family={ICON_FAMILY} name="a" />,
      },
      { icon: { sf: '0.circle' }, selectedIcon: undefined },
    ],
  ] as [NativeTabsTriggerIconProps, NativeTabOptions][])(
    'should append icon props %p to options correctly',
    (props, expected) => {
      const options: NativeTabOptions = {};
      appendIconOptions(options, props);
      expect(options).toEqual(expected);
    }
  );
  it('when vector icon is used, promise is set', () => {
    const options: NativeTabOptions = {};
    const props: NativeTabsTriggerIconProps = {
      src: {
        default: <NativeTabs.Trigger.VectorIcon family={ICON_FAMILY} name="a" />,
        selected: { uri: 'yyy' },
      },
    };
    appendIconOptions(options, props);
    expect(options).toEqual({
      icon: { src: expect.any(Promise) },
      selectedIcon: {
        src: { uri: 'yyy' },
      },
    });
  });
});
