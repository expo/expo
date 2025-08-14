import React from 'react';
import { View } from 'react-native';
import { BottomTabsScreen as _BottomTabsScreen } from 'react-native-screens';

import { usePathname } from '../../../hooks';
import { Redirect } from '../../../link/Redirect';
import { screen, renderRouter, waitFor } from '../../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;

const warn = jest.fn();
const error = jest.fn();

const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = warn;
  console.error = error;
});
afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

it('renders tabs correctly', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
    second: () => <View testID="second" />,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('second')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
});

describe('Tabs visibility', () => {
  it('does not render tab, when not specified', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen.queryByTestId('third')).toBeNull();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
  });

  it('does not render hidden tabs', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
          <NativeTabs.Trigger hidden name="fourth" />
          <NativeTabs.Trigger name="fifth" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
      fourth: () => <View testID="fourth" />,
      fifth: () => <View testID="fifth" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen.queryByTestId('third')).toBeNull();
    expect(screen.queryByTestId('fourth')).toBeNull();
    expect(screen.getByTestId('fifth')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(3);
  });

  it('does not render tabs, when route does not exist', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[Layout children]: Too many screens defined. Route "second" is extraneous.'
    );
  });
});

describe('First focused tab', () => {
  it('index tab is focused when it is first tab', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('index tab is focused when it is second tab', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="second" />
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^second-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^index-[-\w]+/);
  });

  it('Error is thrown, when index is hidden', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        first: () => <View testID="first" />,
        second: () => <View testID="second" />,
      })
    ).toThrow(
      'The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "/index"'
    );
  });

  it('404 is shown, when index does not exist', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="first" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('expo-router-unmatched')).toBeVisible();
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(BottomTabsScreen).not.toHaveBeenCalled();
  });

  it('Correct tab is shown, when index is hidden and redirect is set in layout', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      index: () => <View testID="index" />,
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('first')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('Correct tab is shown, when index does not exist, redirect is set in layout and +not-found is specified', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      '+not-found': () => <View testID="not-found" />,
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('first')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('404 is shown, when index does not exist, redirect is set in layout and no +not-found is specified', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('expo-router-unmatched')).toBeVisible();
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(BottomTabsScreen).not.toHaveBeenCalled();
  });
});

it('when nesting NativeTabs, it throws an Error', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="nested" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      'nested/_layout': () => (
        <NativeTabs>
          <NativeTabs.Trigger name="nested" />
        </NativeTabs>
      ),
      'nested/index': () => <View testID="index-nested" />,
    })
  ).toThrow(
    'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
  );
});
