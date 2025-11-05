import { screen, act, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Button, View } from 'react-native';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
import { Icon, type IconProps } from '../common/elements';
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

it('passes SF Symbol via Icon element', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="house" selectedColor="blue" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options;
  expectSfSymbol(options, 'house');
  expect(options.selectedIconColor).toBe('blue');
});

it('passes SF Symbol with default and selected states', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options;
  expectSfSymbol(options, 'house');
  expect(options.selectedIcon).toHaveProperty('sf');
  // This is to satisfy TypeScript that options.selectedIcon.sf exists
  if (!('sf' in options.selectedIcon)) {
    throw new Error('Expected sf property in selectedIcon options');
  }
  expect(options.selectedIcon.sf).toEqual('house.fill');
});

it('passes image source via src prop', () => {
  const imgSource = { uri: 'https://example.com/icon.png' };
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon src={imgSource} />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.icon).toHaveProperty('src');
  // This is to satisfy TypeScript that options.icon.src exists
  if (!('src' in options.icon)) {
    throw new Error('Expected src property in icon options');
  }
  expect(options.icon.src).toBe(imgSource);
});

it('passes cross-platform icons with sf and androidSrc', () => {
  const androidSource = { uri: 'https://example.com/android.png' };
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="house" androidSrc={androidSource} />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expectSfSymbol(options, 'house');
  // These will be added only on Android
  expect(options.icon).not.toHaveProperty('src');
  expect(options.icon).not.toHaveProperty('androidSrc');
});

it('does not pass icon when Icon is not used', () => {
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
  const call = NativeTabsView.mock.calls[0][0];
  expect(call.tabs[0].options).not.toHaveProperty('icon');
  expect(call.tabs[1].options).not.toHaveProperty('icon');
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

it('uses last Icon when multiple are provided', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="house" />
          <Icon sf="gear" />
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expectSfSymbol(options, 'gear');
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

describe('Icon styles', () => {
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

describe('Dynamic Icon options', () => {
  it('can update icon via unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ icon: { sf: 'house' } }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" unstable_options={{ icon: { sf: 'gear' } }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expectSfSymbol(first.tabs[0].options, 'house');
    expectSfSymbol(second.tabs[0].options, 'gear');
  });

  it('can use dynamic <Icon> to update icon', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ icon: { sf: 'house' } }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Icon sf="gear" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expectSfSymbol(first.tabs[0].options, 'house');
    const second = NativeTabsView.mock.calls[1][0];
    expectSfSymbol(second.tabs[0].options, 'gear');
  });

  it('can override <Icon> from _layout with unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf="house" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" unstable_options={{ icon: { sf: 'gear' } }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expectSfSymbol(first.tabs[0].options, 'house');
    const second = NativeTabsView.mock.calls[1][0];
    expectSfSymbol(second.tabs[0].options, 'gear');
  });

  it('can override <Icon> from _layout with dynamic <Icon>', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf="house" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Icon sf="gear" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expectSfSymbol(first.tabs[0].options, 'house');
    const second = NativeTabsView.mock.calls[1][0];
    expectSfSymbol(second.tabs[0].options, 'gear');
  });

  it('can dynamically update icon with state update', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf="house" />
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: function Index() {
        const [selected, setSelected] = useState(false);
        return (
          <View testID="index">
            <NativeTabs.Trigger name="index">
              <Icon sf={selected ? 'gear' : 'house.fill'} />
            </NativeTabs.Trigger>
            <Button title="Toggle" testID="toggle-button" onPress={() => setSelected((v) => !v)} />
          </View>
        );
      },
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    expectSfSymbol(NativeTabsView.mock.calls[0][0].tabs[0].options, 'house');
    expectSfSymbol(NativeTabsView.mock.calls[1][0].tabs[0].options, 'house.fill');

    jest.clearAllMocks();
    act(() => fireEvent.press(screen.getByTestId('toggle-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expectSfSymbol(NativeTabsView.mock.calls[0][0].tabs[0].options, 'gear');

    jest.clearAllMocks();
    act(() => fireEvent.press(screen.getByTestId('toggle-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expectSfSymbol(NativeTabsView.mock.calls[0][0].tabs[0].options, 'house.fill');
  });

  it('can be used in preview', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ icon: { sf: 'house' } }} />
          <NativeTabs.Trigger name="second" unstable_options={{ icon: { sf: 'gear' } }} />
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
            <Icon sf="star" />
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getAllByTestId('second')).toHaveLength(2);
    expect(within(screen.getByTestId('index')).getByTestId('second')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    const call = NativeTabsView.mock.calls[0][0];
    expectSfSymbol(call.tabs[0].options, 'house');
    expectSfSymbol(call.tabs[1].options, 'gear');
  });

  it.each([
    {
      dynamic: { sf: 'gear' } as IconProps,
      layout: { sf: 'house', selectedColor: 'red' } as IconProps,
      expected: { icon: { sf: 'gear' }, selectedIconColor: 'red' } as NativeTabOptions,
    },
    {
      dynamic: { selectedColor: 'blue' } as IconProps,
      layout: { sf: 'house', selectedColor: 'red' } as IconProps,
      expected: { icon: { sf: 'house' }, selectedIconColor: 'blue' } as NativeTabOptions,
    },
    {
      dynamic: { sf: { selected: 'gear' } } as IconProps,
      layout: { sf: 'house' } as IconProps,
      expected: { icon: undefined, selectedIcon: { sf: 'gear' } } as NativeTabOptions,
    },
    {
      dynamic: { sf: { default: 'gear', selected: 'gear.fill' } } as IconProps,
      layout: { sf: 'house', selectedColor: 'red' } as IconProps,
      expected: {
        icon: { sf: 'gear' },
        selectedIcon: { sf: 'gear.fill' },
        selectedIconColor: 'red',
      } as NativeTabOptions,
    },
    {
      dynamic: { src: { uri: 'https://example.com/new.png' } } as IconProps,
      layout: { sf: 'house' } as IconProps,
      expected: {
        icon: { src: { uri: 'https://example.com/new.png' } },
        selectedIconColor: undefined,
      } as NativeTabOptions,
    },
  ])(
    'dynamic <Icon> $dynamic overrides only specified configuration from <Icon> in _layout $layout',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Icon {...layout} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="second">
              <Icon sf="star" />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Icon {...dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options).toMatchObject(expected);
      expect(second.tabs[1].options).toMatchObject({
        icon: { sf: 'star' },
        selectedIconColor: undefined,
      });
    }
  );

  it.each([
    {
      layout: 'red',
      dynamic: { selectedColor: 'blue' },
      expected: { selectedIconColor: 'blue' },
    },
    {
      layout: 'green',
      dynamic: { selectedColor: 'purple' },
      expected: { selectedIconColor: 'purple' },
    },
  ])(
    'dynamic <Icon selectedColor=$dynamic.selectedColor> overrides selectedIconColor configuration from <NativeTabs iconColor={{selected: $layout}}>',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs iconColor={{ selected: layout }}>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="second">
              <Icon sf="star" />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Icon {...dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options).toMatchObject(expected);
      expect(second.tabs[1].options).toMatchObject({
        icon: { sf: 'star' },
        selectedIconColor: layout,
      });
    }
  );

  it.each([
    {
      layout: 'red',
      dynamic: { sf: 'gear' } as IconProps,
      expected: { icon: { sf: 'gear' }, selectedIconColor: 'red' },
    },
    {
      layout: 'blue',
      dynamic: { src: { uri: 'https://example.com/icon.png' } } as IconProps,
      expected: {
        icon: { src: { uri: 'https://example.com/icon.png' } },
        selectedIconColor: 'blue',
      },
    },
  ])(
    'dynamic <Icon $dynamic> does not override selectedIconColor configuration from <NativeTabs iconColor={{selected: $layout}}>',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs iconColor={{ selected: layout }}>
            <NativeTabs.Trigger name="index" />
            <NativeTabs.Trigger name="second">
              <Icon sf="star" />
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Icon {...dynamic} />
            </NativeTabs.Trigger>
          </View>
        ),
        second: () => <View testID="second" />,
      });
      expect(screen.getByTestId('index')).toBeVisible();
      expect(NativeTabsView).toHaveBeenCalledTimes(2);
      const second = NativeTabsView.mock.calls[1][0];
      expect(second.tabs[0].options).toMatchObject(expected);
      expect(second.tabs[1].options).toMatchObject({
        icon: { sf: 'star' },
        selectedIconColor: layout,
      });
    }
  );
});

function expectSfSymbol(options: NativeTabOptions, expected: string) {
  expect(options.icon).toHaveProperty('sf');
  // This is to satisfy TypeScript that options.icon.sf exists
  if (!('sf' in options.icon)) {
    throw new Error('Expected sf property in icon options');
  }
  expect(options.icon).not.toHaveProperty('src');
  expect(options.icon.sf).toEqual(expected);
}
