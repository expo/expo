import React from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import {
  Tabs as _Tabs,
  type TabsHostProps,
  // @ts-expect-error: method is declared in mock below
  __triggerNativeFocusChange,
} from 'react-native-screens';

import { act, renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  let triggerNativeFocusChange: TabsHostProps['onNativeFocusChange'] = () => {};
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    Tabs: {
      ...actualScreens.Tabs,
      Host: jest.fn(({ children, onNativeFocusChange }) => {
        triggerNativeFocusChange = onNativeFocusChange || (() => {});
        return <View testID="Tabs">{children}</View>;
      }),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
    __triggerNativeFocusChange: (event: Parameters<TabsHostProps['onNativeFocusChange']>[0]) =>
      triggerNativeFocusChange(event),
  };
});

const triggerNativeFocusChange: TabsHostProps['onNativeFocusChange'] = (...args) =>
  act(() => {
    __triggerNativeFocusChange(...args);
  });

const TabsScreen = _Tabs.Screen as jest.MockedFunction<typeof _Tabs.Screen>;

const warn = jest.fn();
const error = jest.fn();

const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = warn;
  console.error = error;
  jest.useFakeTimers();
});
afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
  jest.useRealTimers();
});

describe('NativeTabs.Trigger listeners prop', () => {
  it('calls tabPress listener when tab is pressed', () => {
    const tabPressListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" listeners={{ tabPress: tabPressListener }} />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const indexTabKey = TabsScreen.mock.calls[0][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: indexTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());

    expect(tabPressListener).toHaveBeenCalledTimes(1);
  });

  it('calls functional listeners with route', () => {
    const tabPressListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger
            name="index"
            listeners={({ route }) => ({
              tabPress: () => {
                tabPressListener({
                  routeName: route.name,
                });
              },
            })}
          />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const indexTabKey = TabsScreen.mock.calls[0][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: indexTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());

    expect(tabPressListener).toHaveBeenCalledWith({
      routeName: 'index',
    });
  });

  it('only calls listener for the pressed tab', () => {
    const indexListener = jest.fn();
    const secondListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" listeners={{ tabPress: indexListener }} />
          <NativeTabs.Trigger name="second" listeners={{ tabPress: secondListener }} />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const secondTabKey = TabsScreen.mock.calls[1][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: secondTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());

    expect(indexListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledTimes(1);
  });
});

describe('NativeTabs screenListeners prop', () => {
  it('calls screenListeners for any tab press', () => {
    const screenListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs screenListeners={{ tabPress: screenListener }}>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const indexTabKey = TabsScreen.mock.calls[0][0].tabKey;
    const secondTabKey = TabsScreen.mock.calls[1][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: indexTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());
    expect(screenListener).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    triggerNativeFocusChange({
      nativeEvent: { tabKey: secondTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());
    expect(screenListener).toHaveBeenCalledTimes(1);
  });

  it('calls functional screenListeners with route', () => {
    const screenListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs
          screenListeners={({ route }) => ({
            tabPress: () => {
              screenListener({
                routeName: route.name,
              });
            },
          })}>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const indexTabKey = TabsScreen.mock.calls[0][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: indexTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());

    expect(screenListener).toHaveBeenCalledWith({
      routeName: 'index',
    });
  });

  it('calls both screenListeners and trigger listeners', () => {
    const screenListener = jest.fn();
    const triggerListener = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs screenListeners={{ tabPress: screenListener }}>
          <NativeTabs.Trigger name="index" listeners={{ tabPress: triggerListener }} />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const indexTabKey = TabsScreen.mock.calls[0][0].tabKey;

    triggerNativeFocusChange({
      nativeEvent: { tabKey: indexTabKey, repeatedSelectionHandledBySpecialEffect: false },
    } as NativeSyntheticEvent<{
      tabKey: string;
      repeatedSelectionHandledBySpecialEffect: boolean;
    }>);

    act(() => jest.runAllTimers());

    expect(screenListener).toHaveBeenCalledTimes(1);
    expect(triggerListener).toHaveBeenCalledTimes(1);
  });
});
