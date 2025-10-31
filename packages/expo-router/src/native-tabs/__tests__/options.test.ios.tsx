import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { appendIconOptions } from '../NativeTabTrigger';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
import { Badge, Icon, Label, VectorIcon, type IconProps } from '../common/elements';
import type { NativeTabOptions } from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

jest.mock('../NativeTabsView', () => {
  const actual = jest.requireActual('../NativeTabsView') as typeof import('../NativeTabsView');
  return {
    ...actual,
    NativeTabsView: jest.fn((props) => <actual.NativeTabsView {...props} />),
  };
});

const NativeTabsView = _NativeTabsView as jest.MockedFunction<typeof _NativeTabsView>;

it('can pass options via options prop', () => {
  const indexOptions: NativeTabOptions = {
    title: 'Test Title',
    iconColor: 'blue',
  };
  const secondOptions: NativeTabOptions = {
    title: 'Second Title',
    iconColor: 'red',
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
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const call = NativeTabsView.mock.calls[0][0];
  expect(call.tabs[0].options).toMatchObject({
    ...indexOptions,
  });
  expect(call.tabs[1].options).toMatchObject({
    ...secondOptions,
  });
});

it('can pass options via elements', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="homepod.2.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  expect(NativeTabsView.mock.calls[0][0].tabs[0].options.icon).toStrictEqual({
    sf: 'homepod.2.fill',
  } as NativeTabOptions);
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
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toStrictEqual({
    hidden: false,
    specialEffects: {
      repeatedTabSelection: { popToRoot: true, scrollToTop: true },
    },
    disableTransparentOnScrollEdge: undefined,
    role: undefined,
    iconColor: undefined,
    selectedIconColor: undefined,
    labelStyle: undefined,
    selectedLabelStyle: undefined,
    blurEffect: undefined,
    backgroundColor: undefined,
    badgeBackgroundColor: undefined,
    indicatorColor: undefined,
    badgeTextColor: undefined,
  } as NativeTabOptions);
});

describe('Icons', () => {
  it('when using Icon with sf object, values are passed correctly', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      selectedIcon: { sf: 'star.bubble' },
      icon: { sf: 'stairs' },
    } as NativeTabOptions);
  });

  it('when using Icon drawable on iOS, no value is passed', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon drawable="stairs" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const options = NativeTabsView.mock.calls[0][0].tabs[0].options;
    expect(options.icon).toBeUndefined();
    expect(options.selectedIcon).toBeUndefined();
  });

  it('uses last Icon sf value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf="stairs" />
            <Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      icon: { sf: 'homepod.2.fill' },
      selectedIcon: undefined,
    } as NativeTabOptions);
  });

  it('uses last Icon (selected only) when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ selected: 'stairs' }} />
            <Icon sf={{ selected: 'homepod.2.fill' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject(
      expect.objectContaining({
        selectedIcon: { sf: 'homepod.2.fill' },
      })
    );
  });

  it('uses last Icon sf (string) when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
            <Icon sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }} />
            <Icon sf="0.circle.ar" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      selectedIcon: undefined,
      icon: { sf: '0.circle.ar' },
    } as NativeTabOptions);
  });

  it('uses last Icon sf (selected) when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
            <Icon sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }} />
            <Icon sf={{ selected: '0.circle.ar' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      selectedIcon: { sf: '0.circle.ar' },
      icon: undefined,
    } as NativeTabOptions);
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      selectedIconColor: 'red',
    } as NativeTabOptions);
  });

  it('when selectedIconColor is provided in container and tab, the tab should use the tab color', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs iconColor={{ selected: 'red' }}>
          <NativeTabs.Trigger name="index">
            <Icon selectedColor="blue" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const call = NativeTabsView.mock.calls[0][0];
    expect(call.tabs[0].options).toMatchObject({
      selectedIconColor: 'blue',
    } as NativeTabOptions);
    expect(call.tabs[1].options).toMatchObject({
      selectedIconColor: 'red',
    } as NativeTabOptions);
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).not.toHaveProperty('badgeValue');
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      badgeValue: '3',
    } as NativeTabOptions);
  });

  it('when empty Badge is used, passes space to badgeValue', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.badgeValue).toBe(' '); // Space is used to show empty badge
  });

  it('when empty Badge is used with hidden, passes undefined to badgeValue', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge hidden />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.badgeValue).toBeUndefined();
  });
});

describe('Label', () => {
  it('passes title via Label element', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Custom Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe('Custom Title');
  });

  it('when title is not set, it is undefined in options', () => {
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(undefined);
    expect(NativeTabsView.mock.calls[0][0].tabs[1].options.title).toBe(undefined);
  });

  it('uses last Label value when multiple are provided', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>First Title</Label>
            <Label>Second Title</Label>
            <Label>Last Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      title: 'Last Title',
    } as NativeTabOptions);
  });

  it('when empty Label is used, the title is undefined in options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(undefined); // Route name is added in the rendering component. Options has undefined title
  });

  it('when Label with hidden is used, passes empty string to title', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label hidden />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe(''); // Empty string when Label is hidden
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
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options).toMatchObject({
      selectedLabelStyle: { fontSize: 24, color: 'red' },
    } as NativeTabOptions);
  });

  it('when selectedLabelStyle is provided in container and tab, the tab should use the tab color', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs labelStyle={{ selected: { fontSize: 24, color: 'red' } }}>
          <NativeTabs.Trigger name="index">
            <Label selectedStyle={{ fontSize: 32, color: 'blue' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="one" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      one: () => <View testID="one" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const call = NativeTabsView.mock.calls[0][0];
    expect(call.tabs[0].options).toMatchObject({
      selectedLabelStyle: { fontSize: 32, color: 'blue' },
    } as NativeTabOptions);
    expect(call.tabs[1].options).toMatchObject({
      selectedLabelStyle: { fontSize: 24, color: 'red' },
    } as NativeTabOptions);
  });
});

describe('Tab options', () => {
  describe('disablePopToTop', () => {
    it('When disablePopToTop is true, popToRoot is false', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disablePopToTop>
              <Label>Custom Title</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      const call = NativeTabsView.mock.calls[0][0];
      expect(call.tabs[0].options).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: false,
          },
        },
      } as NativeTabOptions);
    });

    it('When disablePopToTop is not set or false, popToRoot is true', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Label>Custom Title</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="one" disablePopToTop={false}>
              <Label>One</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        one: () => <View testID="one" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      const call = NativeTabsView.mock.calls[0][0];
      expect(call.tabs[0].options).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as NativeTabOptions);
      expect(call.tabs[1].options).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: true,
          },
        },
      } as NativeTabOptions);
    });
  });

  describe('disableScrollToTop', () => {
    it('When disableScrollToTop is true, scrollToTop is false', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" disableScrollToTop>
              <Label>Custom Title</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      const call = NativeTabsView.mock.calls[0][0];
      expect(call.tabs[0].options).toMatchObject({
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: false,
          },
        },
      } as NativeTabOptions);
    });

    it('When disableScrollToTop is not set or false, scrollToTop is true', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Label>Custom Title</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="one" disableScrollToTop={false}>
              <Label>One</Label>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        one: () => <View testID="one" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
      const call = NativeTabsView.mock.calls[0][0];
      expect(call.tabs[0].options).toMatchObject({
        title: 'Custom Title',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as NativeTabOptions);
      expect(call.tabs[1].options).toMatchObject({
        title: 'One',
        specialEffects: {
          repeatedTabSelection: {
            scrollToTop: true,
          },
        },
      } as NativeTabOptions);
    });
  });
});

describe('Dynamic options', () => {
  it('updates options dynamically', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" options={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" options={{ title: 'Updated Title' }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options.title).toBe('Initial Title');
    expect(second.tabs[0].options.title).toBe('Updated Title');
  });

  it('can use components as children', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" options={{ title: 'Initial Title' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Label>Updated Title</Label>
            <Badge>5</Badge>
            <Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options).toMatchObject({
      title: 'Initial Title',
    } as NativeTabOptions);
    expect(second.tabs[0].options).toMatchObject({
      title: 'Updated Title',
      badgeValue: '5',
      icon: {
        sf: 'homepod.2.fill',
      },
      selectedIcon: undefined,
    } as NativeTabOptions);
  });

  it('can override component children from _layout with options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
            <Badge>3</Badge>
            <Icon sf="0.circle" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger
            name="index"
            options={{
              title: 'Updated Title',
              badgeValue: '5',
              icon: { sf: 'homepod.2.fill' },
            }}
          />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      icon: { sf: '0.circle' },
    } as NativeTabOptions);
    expect(second.tabs[0].options).toMatchObject({
      title: 'Updated Title',
      badgeValue: '5',
      icon: {
        sf: 'homepod.2.fill',
      },
    } as NativeTabOptions);
  });

  it('can override component children from _layout with dynamic children', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
            <Badge>3</Badge>
            <Icon sf="0.circle" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Label>Updated Title</Label>
            <Badge>5</Badge>
            <Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options).toMatchObject({
      title: 'Initial Title',
      badgeValue: '3',
      icon: { sf: '0.circle' },
    } as NativeTabOptions);
    expect(second.tabs[0].options).toMatchObject({
      title: 'Updated Title',
      badgeValue: '5',
      icon: {
        sf: 'homepod.2.fill',
      },
    } as NativeTabOptions);
  });

  it('can dynamically update options with state update', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Initial Title</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: function Index() {
        const [value, setValue] = React.useState(0);
        const label = `Updated Title ${value}`;
        return (
          <View testID="index">
            <NativeTabs.Trigger name="index">
              <Label>{label}</Label>
            </NativeTabs.Trigger>
            <Button title="Update" testID="update-button" onPress={() => setValue((v) => v + 1)} />
          </View>
        );
      },
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.title).toBe('Initial Title');
    expect(NativeTabsView.mock.calls[1][0].tabs[0].options.title).toBe('Updated Title 0');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(3);
    expect(NativeTabsView.mock.calls[2][0].tabs[0].options.title).toBe('Updated Title 1');
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(4);
    expect(NativeTabsView.mock.calls[3][0].tabs[0].options.title).toBe('Updated Title 2');
  });

  it('can be used in preview', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" options={{ title: 'Initial Title' }} />
          <NativeTabs.Trigger name="second" options={{ title: 'Second' }} />
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
            <Label>Updated Title</Label>
            <Badge>5</Badge>
            <Icon sf="homepod.2.fill" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    // Tab + preview
    expect(screen.getAllByTestId('second')).toHaveLength(2);
    expect(within(screen.getByTestId('index')).getByTestId('second')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const call = NativeTabsView.mock.calls[0][0];
    expect(call.tabs[0].options.title).toBe('Initial Title');
    expect(call.tabs[0].options.icon).toBeUndefined();
    expect(call.tabs[0].options.selectedIcon).toBeUndefined();
    expect(call.tabs[0].options.badgeValue).toBeUndefined();
    expect(call.tabs[1].options.title).toBe('Second');
    expect(call.tabs[1].options.icon).toBeUndefined();
    expect(call.tabs[1].options.selectedIcon).toBeUndefined();
    expect(call.tabs[1].options.badgeValue).toBeUndefined();
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
        androidSrc: <VectorIcon family={ICON_FAMILY} name="a" />,
      },
      { icon: { sf: '0.circle' }, selectedIcon: undefined },
    ],
  ] as [IconProps, NativeTabOptions][])(
    'should append icon props %p to options correctly',
    (props, expected) => {
      const options: NativeTabOptions = {};
      appendIconOptions(options, props);
      expect(options).toEqual(expected);
    }
  );
  it('when vector icon is used, promise is set', () => {
    const options: NativeTabOptions = {};
    const props: IconProps = {
      src: {
        default: <VectorIcon family={ICON_FAMILY} name="a" />,
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
