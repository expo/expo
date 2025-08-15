import React, { act } from 'react';
import { View } from 'react-native';
import { BottomTabsScreen as _BottomTabsScreen } from 'react-native-screens';

import { router } from '../../../imperative-api';
import { Link } from '../../../link/Link';
import { screen, renderRouter, fireEvent } from '../../../testing-library';
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

describe('Native Bottom Tabs Navigation', () => {
  function expectNoRenders() {
    expect(BottomTabsScreen).not.toHaveBeenCalled();
  }

  function expectOneRender() {
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
  }

  function expectIndexTabFocused() {
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  }

  function expectSecondTabFocused() {
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  }

  beforeEach(() => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
          <NativeTabs.Trigger name="hidden" hidden />
        </NativeTabs>
      ),
      index: () => (
        <View testID="index">
          <Link href="/" testID="index-index-link" />
          <Link href="/second" testID="index-second-link" />
          <Link href="/hidden" testID="index-hidden-link" />
          <Link href="/not-specified" testID="index-not-specified-link" />
        </View>
      ),
      second: () => (
        <View testID="second">
          <Link href="/" testID="second-index-link" />
          <Link href="/second" testID="second-second-link" />
          <Link href="/hidden" testID="second-hidden-link" />
          <Link href="/not-specified" testID="second-not-specified-link" />
        </View>
      ),
      hidden: () => <View testID="hidden" />,
      notSpecified: () => <View testID="not-specified" />,
    });
    expectOneRender();
    expectIndexTabFocused();
    BottomTabsScreen.mockClear();
  });

  it('can navigate using router.push', () => {
    act(() => router.push('/second'));
    expectOneRender();
    expectSecondTabFocused();
    BottomTabsScreen.mockClear();
    act(() => router.push('/'));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('can navigate using Link', () => {
    act(() => fireEvent.press(screen.getByTestId('index-second-link')));
    expectOneRender();
    expectSecondTabFocused();
    BottomTabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-index-link')));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('does not re-render when router.push is called to the same tab', () => {
    act(() => router.push('/'));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('re-renders when Link is pressed to the same tab', () => {
    act(() => fireEvent.press(screen.getByTestId('index-index-link'))); // link to same tab
    expectOneRender();
    expectIndexTabFocused();

    BottomTabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused();

    BottomTabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-second-link'))); // link to same tab
    expectOneRender();
    expectSecondTabFocused();
  });

  it('when Link is pressed to a hidden tab, no navigation occurs', () => {
    act(() => fireEvent.press(screen.getByTestId('index-hidden-link')));
    expectNoRenders();

    BottomTabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused();

    BottomTabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expectNoRenders();
  });

  it('when Link is pressed to a not-specified tab, no navigation occurs', () => {
    act(() => fireEvent.press(screen.getByTestId('index-not-specified-link')));
    expectNoRenders();

    BottomTabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused();

    BottomTabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expectNoRenders();
  });
});
