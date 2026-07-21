import { screen, act, fireEvent, waitFor } from '@testing-library/react-native';
import { Children, isValidElement, useState, type ComponentProps, type ReactNode } from 'react';
import { Button, Text, View } from 'react-native';
import { Tabs, type TabsScreenProps } from 'react-native-screens';
import { SafeAreaView } from 'react-native-screens/experimental';

import type { ColorType } from '../../color';
import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import type { DrawableIcon, MaterialIcon, SFSymbolIcon, SrcIcon } from '../common/elements';
import { SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES } from '../types';

// Mock Color API with known test values
jest.mock('../../color', (): typeof import('../../color') => ({
  ...(jest.requireActual('../../color') as typeof import('../../color')),
  Color: {
    android: {
      dynamic: {
        onSurfaceVariant: 'mock-onSurfaceVariant',
        onSecondaryContainer: 'mock-onSecondaryContainer',
        onSurface: 'mock-onSurface',
        surfaceContainer: 'mock-surfaceContainer',
        primary: 'mock-primary',
        secondaryContainer: 'mock-secondaryContainer',
      } as ColorType['android']['dynamic'],
    } as ColorType['android'],
  } as ColorType,
}));

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
jest.mock('react-native-screens/experimental', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  function RNSSafeAreaView({ children }: { children: ReactNode }) {
    return <View testID="SafeAreaView">{children}</View>;
  }
  return {
    ...(jest.requireActual(
      'react-native-screens/experimental'
    ) as typeof import('react-native-screens/experimental')),
    SafeAreaView: RNSSafeAreaView,
  };
});

// Echo the symbol name into `uri` so assertions can verify which icon ends up
// in `icon` vs `selectedIcon` — the default expo-font mock returns an empty uri
// for every call, which can't distinguish between symbols.
jest.mock('expo-symbols', () => ({
  ...(jest.requireActual('expo-symbols') as typeof import('expo-symbols')),
  unstable_getMaterialSymbolSourceAsync: jest.fn(async (name: string | null) =>
    name == null ? null : { uri: name, width: 0, height: 0, scale: 1 }
  ),
}));

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

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
  expect(TabsScreen).toHaveBeenCalledTimes(2);
  expect(TabsScreen.mock.calls[0][0]).toMatchObject({
    ...indexOptions,
  });
  expect(TabsScreen.mock.calls[1][0]).toMatchObject({
    ...secondOptions,
  });
});

it('can pass options via elements', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon drawable="test" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsScreen).toHaveBeenCalledTimes(1);
  expect(TabsScreen.mock.calls[0][0]).toMatchObject({
    android: {
      icon: { type: 'drawableResource', name: 'test' },
      // selectedIcon mirrors icon — temporary fallback for the react-native-screens upstream bug.
      selectedIcon: { type: 'drawableResource', name: 'test' },
    },
  } as TabsScreenProps);
});

it('when no options are passed, default ones are used', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(TabsScreen).toHaveBeenCalledTimes(1);
  expect(TabsScreen.mock.calls[0][0]).toMatchObject({
    hidden: false,
    specialEffects: {},
    screenKey: expect.stringMatching(/^index-[-\w]+/),
    children: expect.objectContaining({}),
    android: { icon: undefined, selectedIcon: undefined },
  } as TabsScreenProps);
});

describe('disabled', () => {
  it.each([true, false] as const)(
    'forwards disabled=%p to Tabs.Screen as preventNativeSelection',
    (value) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disabled={value} />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsScreen).toHaveBeenCalled();
      expect(TabsScreen.mock.calls.at(-1)![0]).toMatchObject({
        preventNativeSelection: value,
      } as TabsScreenProps);
    }
  );

  it('does not forward preventNativeSelection when disabled is not set', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalled();
    expect(TabsScreen.mock.calls.at(-1)![0].preventNativeSelection).toBeUndefined();
  });
});

describe('testID and accessibilityLabel', () => {
  it('forwards testID and accessibilityLabel to Tabs.Screen tab bar item props', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" testID="home-tab" accessibilityLabel="Home tab" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalled();
    expect(TabsScreen.mock.calls.at(-1)![0]).toMatchObject({
      tabBarItemTestID: 'home-tab',
      tabBarItemAccessibilityLabel: 'Home tab',
    } as TabsScreenProps);
  });
});

describe('Icons', () => {
  let consoleWarnMock: jest.Mock;
  beforeEach(() => {
    consoleWarnMock = jest.fn();
    console.warn = consoleWarnMock;
  });
  it('when using Icon with drawable prop, it is passed as drawable', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon drawable="homepod" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: { icon: { type: 'drawableResource', name: 'homepod' } },
    } as TabsScreenProps);
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when using Icon sf on Android, no value is passed', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].icon).toBeUndefined();
    expect(TabsScreen.mock.calls[0][0].selectedIcon).toBeUndefined();
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('uses last Icon drawable value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon drawable="stairs" />
            <NativeTabs.Trigger.Icon drawable="homepod" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        icon: { type: 'drawableResource', name: 'homepod' },
        // selectedIcon mirrors icon — temporary fallback for the react-native-screens upstream bug.
        selectedIcon: { type: 'drawableResource', name: 'homepod' },
      },
    } as TabsScreenProps);
    expect(consoleWarnMock).not.toHaveBeenCalled();
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          selected: {
            tabBarItemIconColor: 'red',
          },
        },
      },
    } as Partial<TabsScreenProps>);
    expect(consoleWarnMock).not.toHaveBeenCalled();
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          selected: {
            tabBarItemIconColor: 'blue',
          },
        },
      },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: {
        standardAppearance: {
          selected: {
            tabBarItemIconColor: 'red',
          },
        },
      },
    } as Partial<TabsScreenProps>);
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when drawable={{default, selected}} is provided, both icons are passed', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon
              drawable={{ default: 'ic_home_outline', selected: 'ic_home_filled' }}
            />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        icon: { type: 'drawableResource', name: 'ic_home_outline' },
        selectedIcon: { type: 'drawableResource', name: 'ic_home_filled' },
      },
    } as TabsScreenProps);
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when drawable={{selected}} only is provided, icon is undefined and selectedIcon is passed', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon drawable={{ selected: 'ic_home_filled' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].android?.icon).toBeUndefined();
    expect(TabsScreen.mock.calls[0][0].android?.selectedIcon).toEqual({
      type: 'drawableResource',
      name: 'ic_home_filled',
    });
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when src={{default, selected}} is provided, both icons are passed', () => {
    const defaultSrc = { uri: 'default-icon' };
    const selectedSrc = { uri: 'selected-icon' };
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon src={{ default: defaultSrc, selected: selectedSrc }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        icon: { type: 'imageSource', imageSource: defaultSrc },
        selectedIcon: { type: 'imageSource', imageSource: selectedSrc },
      },
    } as TabsScreenProps);
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when md={{default, selected}} is provided, both icons are loaded asynchronously', async () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon md={{ default: 'home', selected: 'home_filled' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    await waitFor(() => {
      expect(screen.getByTestId('index')).toBeVisible();
    });
    const lastCall = TabsScreen.mock.calls.at(-1)![0];
    expect(lastCall.android?.icon).toEqual({
      type: 'imageSource',
      imageSource: { height: 0, uri: 'home', width: 0, scale: 1 },
    });
    expect(lastCall.android?.selectedIcon).toEqual({
      type: 'imageSource',
      imageSource: { height: 0, uri: 'home_filled', width: 0, scale: 1 },
    });
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it('when md={{selected}} only is provided, icon is undefined and selectedIcon is loaded asynchronously', async () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon md={{ selected: 'home_filled' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    await waitFor(() => {
      expect(screen.getByTestId('index')).toBeVisible();
    });
    const lastCall = TabsScreen.mock.calls.at(-1)![0];
    expect(lastCall.android?.icon).toBeUndefined();
    expect(lastCall.android?.selectedIcon).toEqual({
      type: 'imageSource',
      imageSource: { height: 0, uri: 'home_filled', width: 0, scale: 1 },
    });
    expect(consoleWarnMock).not.toHaveBeenCalled();
  });

  it.each([
    { expectedIcon: undefined },
    { drawable: 'test', expectedIcon: { type: 'drawableResource', name: 'test' } },
    {
      drawable: '1234',
      src: { uri: 'some-uri' },
      expectedIcon: { type: 'drawableResource', name: '1234' },
    },
    {
      drawable: '1234',
      expectedIcon: { type: 'drawableResource', name: '1234' },
    },
    {
      sf: '0.circle',
      src: { uri: 'some-uri' },
      drawable: 'ic_some_drawable',
      expectedIcon: { type: 'drawableResource', name: 'ic_some_drawable' },
    },
    {
      src: { uri: 'some-uri' },
      expectedIcon: { type: 'imageSource', imageSource: { uri: 'some-uri' } },
    },
    {
      src: { uri: 'some-uri' },
      sf: '0.circle',
      expectedIcon: { type: 'imageSource', imageSource: { uri: 'some-uri' } },
    },
  ] as (DrawableIcon &
    SrcIcon &
    SFSymbolIcon & {
      expectedIcon: NonNullable<NonNullable<TabsScreenProps['android']>['icon']>;
    })[])(
    'For <Icon sf="$sf" src="$src" drawable="$drawable">, icon is $expectedIcon',
    ({ sf, src, drawable, expectedIcon }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Icon sf={sf} src={src} drawable={drawable} />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(TabsScreen.mock.calls[0][0].android?.icon).toEqual(expectedIcon);
      expect(consoleWarnMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    { md: '10k' },
    {
      md: 'cable',
      src: { uri: 'some-uri' },
    },
    { md: '10k', sf: 'square.fill' },
    { md: '10k', sf: 'square.fill', src: { uri: 'some-uri' } },
  ] as (MaterialIcon & SrcIcon & SFSymbolIcon)[])(
    'For <Icon sf="$sf" src="$src" md="$md">, icon will render a md icon',
    async ({ sf, src, md }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Icon sf={sf} src={src} md={md} />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      // Wrapping with waitFor to ensure material vector icon async loading is complete
      // Otherwise testing library will complain "An update to Screen inside a test was not wrapped in act(...)"
      // because vector icon loading triggers a state update
      await waitFor(() => {
        expect(screen.getByTestId('index')).toBeVisible();
      });
      expect(TabsScreen).toHaveBeenCalledTimes(2);
      expect(TabsScreen.mock.calls[0][0].android?.icon).toBeUndefined();
      expect(TabsScreen.mock.calls[1][0].android?.icon).toEqual({
        imageSource: { height: 0, uri: md, width: 0, scale: 1 },
        type: 'imageSource',
      });
      expect(consoleWarnMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    { md: '10k', drawable: undefined, expectedIcon: undefined, numberOfRenders: 2 },
    {
      md: 'cable',
      drawable: 'ic_lock',
      expectedIcon: { type: 'drawableResource', name: 'ic_lock' },
      numberOfRenders: 1,
    },
    {
      md: undefined,
      drawable: 'ic_lock',
      expectedIcon: { type: 'drawableResource', name: 'ic_lock' },
      numberOfRenders: 1,
    },
  ] as (MaterialIcon &
    DrawableIcon & {
      expectedIcon: NonNullable<NonNullable<TabsScreenProps['android']>['icon']>;
      numberOfRenders: number;
    })[])(
    'For <Icon md="$md" drawable="$drawable">, icon will be $expectedIcon during first render and tabs will render $numberOfRenders time(s)',
    async ({ md, drawable, numberOfRenders, expectedIcon }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <NativeTabs.Trigger.Icon md={md} drawable={drawable} />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      // Wrapping with waitFor to ensure md vector icon async loading is complete
      // Otherwise testing library will complain "An update to Screen inside a test was not wrapped in act(...)"
      // because vector icon loading triggers a state update
      await waitFor(() => {
        expect(screen.getByTestId('index')).toBeVisible();
      });
      expect(TabsScreen).toHaveBeenCalledTimes(numberOfRenders);
      expect(TabsScreen.mock.calls[0][0].android?.icon).toEqual(expectedIcon);
      if (numberOfRenders > 1) {
        expect(TabsScreen.mock.calls[1][0].android?.icon).toEqual({
          imageSource: { height: 0, uri: md, width: 0, scale: 1 },
          type: 'imageSource',
        });
      }
      expect(consoleWarnMock).toHaveBeenCalledTimes(1);
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '5',
    } as TabsScreenProps);
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: 'New',
    } as TabsScreenProps);
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).not.toHaveProperty('badgeValue');
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      badgeValue: '3',
    } as TabsScreenProps);
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].badgeValue).toBe(' '); // Space is used to show empty badge
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].badgeValue).toBeUndefined();
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Custom Title',
    } as TabsScreenProps);
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].title).toBe('index');
    expect(TabsScreen.mock.calls[1][0].title).toBe('one');
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Last Title',
    } as TabsScreenProps);
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].title).toBe('index'); // Route name is used as title when Label is empty
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].title).toBe(''); // Route name is used as title when Label is empty
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
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarItemTitleLargeLabelFontSize: 24,
          tabBarItemTitleSmallLabelFontSize: undefined,
          selected: {
            tabBarItemTitleFontColor: 'red',
          },
        },
      },
    } as Partial<TabsScreenProps>);
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarItemTitleSmallLabelFontSize: undefined,
          tabBarItemTitleLargeLabelFontSize: 32,
          selected: {
            tabBarItemTitleFontColor: 'blue',
          },
        },
      },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarItemTitleSmallLabelFontSize: undefined,
          tabBarItemTitleLargeLabelFontSize: 24,
          selected: {
            tabBarItemTitleFontColor: 'red',
          },
        },
      },
    } as Partial<TabsScreenProps>);
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
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(TabsScreen.mock.calls[0][0]).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: false,
          },
        },
      } as TabsScreenProps);
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
      expect(TabsScreen).toHaveBeenCalledTimes(2);
      expect(TabsScreen.mock.calls[0][0]).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as TabsScreenProps);
      expect(TabsScreen.mock.calls[1][0]).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as TabsScreenProps);
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
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(TabsScreen.mock.calls[0][0]).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: false,
          },
        },
      } as TabsScreenProps);
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
      expect(TabsScreen).toHaveBeenCalledTimes(2);
      expect(TabsScreen.mock.calls[0][0]).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as TabsScreenProps);
      expect(TabsScreen.mock.calls[1][0]).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as TabsScreenProps);
    });
  });

  it.each([false, undefined])(
    'When disableAutomaticContentInsets is %p, the content of the screen is wrapped with SafeAreaView',
    (value) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disableAutomaticContentInsets={value} />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      const children = TabsScreen.mock.calls[0][0].children;
      expect(isValidElement(children)).toBe(true);
      // Type assertion to satisfy TypeScript
      if (!isValidElement(children)) throw new Error();
      expect(children.type).toBe(SafeAreaView);
      expect(Object.keys(children.props as Record<string, unknown>)).toContain('edges');
      expect((children.props as ComponentProps<typeof SafeAreaView>).edges).toStrictEqual({
        bottom: true,
      });
    }
  );
  it('When disableAutomaticContentInsets is true, the content of the screen is not wrapped with SafeAreaView', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" disableAutomaticContentInsets />
        </NativeTabs>
      ),
      index: () => <Text testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    const children = TabsScreen.mock.calls[0][0].children;
    expect(Children.count(children)).toBe(1);
    expect(isValidElement(children)).toBe(true);
    // Type assertion to satisfy TypeScript
    if (!isValidElement(children)) throw new Error();
    expect(children.type).not.toBe(SafeAreaView);
  });

  it('does not wrap the screen content with SafeAreaView when the tab bar is hidden', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs hidden>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <Text testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    const children = TabsScreen.mock.calls[0][0].children;
    expect(isValidElement(children)).toBe(true);
    if (!isValidElement(children)) throw new Error();
    expect(children.type).not.toBe(SafeAreaView);
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      children: expect.objectContaining({}),
      android: { icon: undefined, selectedIcon: undefined },
    } as TabsScreenProps);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      children: expect.objectContaining({}),
      android: { icon: undefined, selectedIcon: undefined },
    } as TabsScreenProps);
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
            <NativeTabs.Trigger.Icon drawable="test" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      android: { icon: undefined, selectedIcon: undefined },
    } as TabsScreenProps);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      badgeValue: '5',
      android: {
        icon: {
          type: 'drawableResource',
          name: 'test',
        },
        // selectedIcon mirrors icon — temporary fallback for the react-native-screens upstream bug.
        selectedIcon: {
          type: 'drawableResource',
          name: 'test',
        },
      },
    } as TabsScreenProps);
  });

  it('can override component children from _layout with unstable_nativeProps', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon drawable="test" />
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
              android: {
                icon: { type: 'drawableResource', name: '1234' },
              },
            }}
          />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      android: {
        icon: {
          type: 'drawableResource',
          name: 'test',
        },
      },
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
    } as TabsScreenProps);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      badgeValue: '5',
      android: {
        icon: {
          type: 'drawableResource',
          name: '1234',
        },
      },
    } as TabsScreenProps);
  });

  it('can override component children from _layout with dynamic children', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Initial Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon drawable="test" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Updated Title</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge>5</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Icon drawable="1234" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      android: {
        icon: {
          type: 'drawableResource',
          name: 'test',
        },
      },
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
    } as TabsScreenProps);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Updated Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      badgeValue: '5',
      android: {
        icon: {
          type: 'drawableResource',
          name: '1234',
        },
      },
    } as TabsScreenProps);
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
        const [value, setValue] = useState(0);
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].title).toBe('Initial Title');
    expect(TabsScreen.mock.calls[1][0].title).toBe('Updated Title 0');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(TabsScreen).toHaveBeenCalledTimes(3);
    expect(TabsScreen.mock.calls[2][0].title).toBe('Updated Title 1');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(TabsScreen).toHaveBeenCalledTimes(4);
    expect(TabsScreen.mock.calls[3][0].title).toBe('Updated Title 2');
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      title: 'Initial Title',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^index-[-\w]+/),
      android: { icon: undefined, selectedIcon: undefined },
    } as TabsScreenProps);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      title: 'Second',
      hidden: false,
      specialEffects: {},
      screenKey: expect.stringMatching(/^second-[-\w]+/),
      android: { icon: undefined, selectedIcon: undefined },
    } as TabsScreenProps);
  });
});

describe('Material Design 3 dynamic color defaults', () => {
  it('applies Material Design 3 dynamic color defaults when no custom colors are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          normal: {
            tabBarItemIconColor: 'mock-onSurfaceVariant',
            tabBarItemTitleFontColor: 'mock-onSurfaceVariant',
          },
          selected: {
            tabBarItemIconColor: 'mock-onSecondaryContainer',
            tabBarItemTitleFontColor: 'mock-onSurface',
          },
          tabBarBackgroundColor: 'mock-surfaceContainer',
          tabBarItemRippleColor: 'mock-primary',
          tabBarItemActiveIndicatorColor: 'mock-secondaryContainer',
        },
      },
    } as Partial<TabsScreenProps>);
  });

  it('uses custom tintColor when provided, overriding Material defaults for active states', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs tintColor="red">
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          normal: {
            tabBarItemIconColor: 'mock-onSurfaceVariant',
            tabBarItemTitleFontColor: 'mock-onSurfaceVariant',
          },
          selected: {
            tabBarItemIconColor: 'red',
            tabBarItemTitleFontColor: 'red',
          },
          tabBarBackgroundColor: 'mock-surfaceContainer',
          tabBarItemRippleColor: 'mock-primary',
        },
      },
    } as Partial<TabsScreenProps>);
  });

  it('uses custom rippleColor when provided, overriding Material default', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs rippleColor="blue">
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarItemRippleColor: 'blue',
          tabBarBackgroundColor: 'mock-surfaceContainer',
        },
      },
    } as Partial<TabsScreenProps>);
  });

  it('uses appearance options when provided, overriding Material defaults', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs
          iconColor={{ default: 'green', selected: 'yellow' }}
          labelStyle={{ default: { color: 'purple' }, selected: { color: 'orange' } }}
          backgroundColor="pink">
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarBackgroundColor: 'pink',
          normal: {
            tabBarItemIconColor: 'green',
            tabBarItemTitleFontColor: 'purple',
          },
          selected: {
            tabBarItemIconColor: 'yellow',
            tabBarItemTitleFontColor: 'orange',
          },
        },
      },
    } as Partial<TabsScreenProps>);
  });

  it('uses container indicatorColor when provided, overriding Material default', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs indicatorColor="cyan">
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: {
        standardAppearance: {
          tabBarItemActiveIndicatorColor: 'cyan',
          tabBarBackgroundColor: 'mock-surfaceContainer',
        },
      },
    } as Partial<TabsScreenProps>);
  });

  it('uses per-trigger indicatorColor when provided, overriding navigator indicatorColor', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs indicatorColor="cyan">
          <NativeTabs.Trigger name="index" indicatorColor="magenta" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemActiveIndicatorColor: 'magenta' } },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemActiveIndicatorColor: 'cyan' } },
    } as Partial<TabsScreenProps>);
  });

  it('uses per-trigger rippleColor when provided, overriding navigator rippleColor', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs rippleColor="blue">
          <NativeTabs.Trigger name="index" rippleColor="green" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemRippleColor: 'green' } },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemRippleColor: 'blue' } },
    } as Partial<TabsScreenProps>);
  });

  it('uses per-trigger disableIndicator when provided, overriding navigator disableIndicator', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs disableIndicator>
          <NativeTabs.Trigger name="index" disableIndicator={false} />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemActiveIndicatorEnabled: true } },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemActiveIndicatorEnabled: false } },
    } as Partial<TabsScreenProps>);
  });

  it.each(SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES)(
    'supports %s label visibility mode at the navigator level',
    (labelVisibilityMode) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelVisibilityMode={labelVisibilityMode}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(
        TabsScreen.mock.calls[0][0].android?.standardAppearance?.tabBarItemLabelVisibilityMode
      ).toBe(labelVisibilityMode);
    }
  );

  describe('labelVisibilityMode validation', () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it.each([
      'test',
      'wrongValue',
      ...SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((x) => x.toUpperCase()),
    ])('warns when unsupported %s label visibility mode is used', (labelVisibilityMode) => {
      renderRouter({
        _layout: () => (
          // @ts-expect-error
          <NativeTabs labelVisibilityMode={labelVisibilityMode}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });
      expect(warn).toHaveBeenCalledWith(
        `Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
      );
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(
        TabsScreen.mock.calls[0][0].android?.standardAppearance?.tabBarItemLabelVisibilityMode
      ).toBeUndefined();
    });

    it('warns when unsupported per-trigger labelVisibilityMode is used', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            {/* @ts-expect-error */}
            <NativeTabs.Trigger name="index" labelVisibilityMode="bogus" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });
      expect(warn).toHaveBeenCalledWith(
        `Unsupported labelVisibilityMode: bogus. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
      );
      expect(
        TabsScreen.mock.calls[0][0].android?.standardAppearance?.tabBarItemLabelVisibilityMode
      ).toBeUndefined();
    });
  });

  it('uses per-trigger labelVisibilityMode when provided, overriding navigator labelVisibilityMode', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs labelVisibilityMode="labeled">
          <NativeTabs.Trigger name="index" labelVisibilityMode="unlabeled" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemLabelVisibilityMode: 'unlabeled' } },
    } as Partial<TabsScreenProps>);
    expect(TabsScreen.mock.calls[1][0]).toMatchObject({
      android: { standardAppearance: { tabBarItemLabelVisibilityMode: 'labeled' } },
    } as Partial<TabsScreenProps>);
  });
});
