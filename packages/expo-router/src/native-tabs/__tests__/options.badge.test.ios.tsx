import { screen, act, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Button, View } from 'react-native';

import { HrefPreview } from '../../link/preview/HrefPreview';
import { renderRouter, within } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView as _NativeTabsView } from '../NativeTabsView';
import { Badge, type BadgeProps } from '../common/elements';
import type { NativeTabOptions, NativeTabsLabelStyle } from '../types';

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
          <Badge selectedBackgroundColor="red">5</Badge>
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
          <Badge>{123}</Badge>
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
          <Badge>1</Badge>
          <Badge>2</Badge>
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
          <Badge />
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
          <Badge hidden />
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

describe('Dynamic options', () => {
  it('can update badge via unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ badgeValue: 'Initial' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index" unstable_options={{ badgeValue: 'Updated' }} />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    const second = NativeTabsView.mock.calls[1][0];
    expect(first.tabs[0].options.badgeValue).toBe('Initial');
    expect(second.tabs[0].options.badgeValue).toBe('Updated');
  });

  it('can use dynamic <Badge> to update badgeValue', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ badgeValue: 'Initial' }} />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Badge>Updated</Badge>
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.badgeValue).toBe('Initial');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.badgeValue).toBe('Updated');
  });

  it('can override <Badge> from _layout with unstable_options', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>Initial</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger
            name="index"
            unstable_options={{
              badgeValue: 'Updated',
            }}
          />
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.badgeValue).toBe('Initial');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.badgeValue).toBe('Updated');
  });

  it('can override <Badge> from _layout with dynamic <Badge>', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>Initial</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <NativeTabs.Trigger name="index">
            <Badge>Updated</Badge>
          </NativeTabs.Trigger>
        </View>
      ),
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    const first = NativeTabsView.mock.calls[0][0];
    expect(first.tabs[0].options.badgeValue).toBe('Initial');
    const second = NativeTabsView.mock.calls[1][0];
    expect(second.tabs[0].options.badgeValue).toBe('Updated');
  });

  it('can dynamically update badgeValue with state update', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Badge>Initial</Badge>
          </NativeTabs.Trigger>
        </NativeTabs>
      ),
      index: function Index() {
        const [value, setValue] = React.useState(0);
        const badge = `Updated ${value}`;
        return (
          <View testID="index">
            <NativeTabs.Trigger name="index">
              <Badge>{badge}</Badge>
            </NativeTabs.Trigger>
            <Button title="Update" testID="update-button" onPress={() => setValue((v) => v + 1)} />
          </View>
        );
      },
    });
    expect(screen.getByTestId('index')).toBeVisible();
    // initial render results in layout + index
    expect(NativeTabsView).toHaveBeenCalledTimes(2);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.badgeValue).toBe('Initial');
    expect(NativeTabsView.mock.calls[1][0].tabs[0].options.badgeValue).toBe('Updated 0');

    jest.clearAllMocks();
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.badgeValue).toBe('Updated 1');

    jest.clearAllMocks();
    act(() => fireEvent.press(screen.getByTestId('update-button')));
    expect(NativeTabsView).toHaveBeenCalledTimes(1);
    expect(NativeTabsView.mock.calls[0][0].tabs[0].options.badgeValue).toBe('Updated 2');
  });

  it('can be used in preview', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" unstable_options={{ badgeValue: 'Initial' }} />
          <NativeTabs.Trigger name="second" unstable_options={{ badgeValue: 'Second' }} />
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
            <Badge>Updated</Badge>
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
    expect(call.tabs[0].options.badgeValue).toBe('Initial');
    expect(call.tabs[1].options.badgeValue).toBe('Second');
  });

  it.each([
    {
      dynamic: { selectedBackgroundColor: 'blue' } as BadgeProps,
      layout: { children: 'test', selectedBackgroundColor: 'red' } as BadgeProps,
      expected: { badgeValue: ' ', selectedBadgeBackgroundColor: 'blue' } as NativeTabOptions,
    },
    {
      dynamic: { children: 'Updated' } as BadgeProps,
      layout: { hidden: true, selectedBackgroundColor: 'red' } as BadgeProps,
      expected: {
        badgeValue: 'Updated',
        selectedBadgeBackgroundColor: undefined,
      } as NativeTabOptions,
    },
    {
      dynamic: { hidden: true } as BadgeProps,
      layout: { children: 'test' } as BadgeProps,
      expected: {
        badgeValue: undefined,
        selectedBadgeBackgroundColor: undefined,
      } as NativeTabOptions,
    },
  ])(
    'dynamic <Badge> $dynamic overrides whole badge configuration from <Badge> in _layout $layout',
    ({ layout, dynamic, expected }) => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Badge {...layout} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="second">
              <Badge>Second</Badge>
            </NativeTabs.Trigger>
          </NativeTabs>
        ),
        index: () => (
          <View testID="index">
            <NativeTabs.Trigger>
              <Badge {...dynamic} />
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
        badgeValue: 'Second',
        selectedBadgeBackgroundColor: undefined,
      });
    }
  );
});
