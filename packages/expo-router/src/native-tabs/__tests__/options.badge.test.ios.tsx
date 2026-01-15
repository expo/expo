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

it('passes badge value via Badge element', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Badge selectedBackgroundColor="red">5</NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.badgeValue).toBe('5');
  expect(options.selectedBadgeBackgroundColor).toBe('red');
});

it('passes badge value as string when non-string children provided', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Badge>123</NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.badgeValue).toBe('123');
});

it('does not pass badge when Badge is not used', () => {
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
  expect(call.tabs[0].options.badgeValue).toBeUndefined();
  expect(call.tabs[1].options.badgeValue).toBeUndefined();
});

it('uses last Badge value when multiple are provided', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge>
          <NativeTabs.Trigger.Badge>2</NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.badgeValue).toBe('2');
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
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.badgeValue).toBe(' ');
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
  expect(NativeTabsView).toHaveBeenCalledTimes(1);
  const options = NativeTabsView.mock.calls[0][0].tabs[0].options as NativeTabOptions;
  expect(options.badgeValue).toBeUndefined();
});
