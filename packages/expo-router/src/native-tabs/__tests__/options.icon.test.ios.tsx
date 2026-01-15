import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
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
          <NativeTabs.Trigger.Icon sf="house" selectedColor="blue" />
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
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
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
          <NativeTabs.Trigger.Icon src={imgSource} />
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

it('passes cross-platform icons with sf and md', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house" md="house" />
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
          <NativeTabs.Trigger.Icon drawable="stairs" />
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
          <NativeTabs.Trigger.Icon sf="house" />
          <NativeTabs.Trigger.Icon sf="gear" />
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
          <NativeTabs.Trigger.Icon sf={{ selected: 'stairs' }} />
          <NativeTabs.Trigger.Icon sf={{ selected: 'homepod.2.fill' }} />
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
          <NativeTabs.Trigger.Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
          <NativeTabs.Trigger.Icon sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }} />
          <NativeTabs.Trigger.Icon sf="0.circle.ar" />
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
          <NativeTabs.Trigger.Icon sf={{ default: 'stairs', selected: 'star.bubble' }} />
          <NativeTabs.Trigger.Icon sf={{ default: 'homepod.2.fill', selected: 'homepod.2.fill' }} />
          <NativeTabs.Trigger.Icon sf={{ selected: '0.circle.ar' }} />
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
            <NativeTabs.Trigger.Icon selectedColor="blue" />
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

function expectSfSymbol(options: NativeTabOptions, expected: string) {
  expect(options.icon).toHaveProperty('sf');
  // This is to satisfy TypeScript that options.icon.sf exists
  if (!('sf' in options.icon)) {
    throw new Error('Expected sf property in icon options');
  }
  expect(options.icon).not.toHaveProperty('src');
  expect(options.icon.sf).toEqual(expected);
}
