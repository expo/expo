import { screen } from '@testing-library/react-native';
import React from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import {
  BottomTabsScreen as _BottomTabsScreen,
  BottomTabs as _BottomTabs,
  type BottomTabsProps,
  // @ts-expect-error: method is declared in mock below
  __triggerNativeFocusChange,
} from 'react-native-screens';

import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { act, renderRouter } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  let triggerNativeFocusChange: BottomTabsProps['onNativeFocusChange'] = () => {};
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children, onNativeFocusChange }) => {
      triggerNativeFocusChange = onNativeFocusChange || (() => {});
      return <View testID="BottomTabs">{children}</View>;
    }),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
    __triggerNativeFocusChange: (event: Parameters<BottomTabsProps['onNativeFocusChange']>[0]) =>
      triggerNativeFocusChange(event),
  };
});

const triggerNativeFocusChange: BottomTabsProps['onNativeFocusChange'] = (...args) =>
  act(() => {
    __triggerNativeFocusChange(...args);
  });

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;

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

it('emits tabPress event onNativeFocusChange', () => {
  const indexTabPressHandler = jest.fn();
  const secondTabPressHandler = jest.fn();
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" />
      </NativeTabs>
    ),
    index: function Index() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', () => {
          indexTabPressHandler();
        });
      }, [navigation]);
      return <View testID="index" />;
    },
    second: function Second() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', () => {
          secondTabPressHandler();
        });
      }, [navigation]);
      return <View testID="second" />;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('second')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
  expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/index-\w+/);
  expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/second-\w+/);

  const indexTabKey = BottomTabsScreen.mock.calls[0][0].tabKey;
  const secondTabKey = BottomTabsScreen.mock.calls[1][0].tabKey;

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(0);

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: indexTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(1);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: secondTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(1);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: secondTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(1);
});

// The pop will be handled by native side, so js should not do it again
it('does not pop stack on repeated tab press', async () => {
  const indexTabPressHandler = jest.fn();
  const aIndexTabPressHandler = jest.fn();
  const aBTabPressHandler = jest.fn();
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="a" />
      </NativeTabs>
    ),
    index: function Index() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', () => {
          indexTabPressHandler();
        });
      }, [navigation]);
      return <View testID="index" />;
    },
    'a/_layout': () => <Stack />,
    'a/index': function Second() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', () => {
          aIndexTabPressHandler();
        });
      }, [navigation]);
      return <View testID="a-index" />;
    },
    'a/b': function Second() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', () => {
          aBTabPressHandler();
        });
      }, [navigation]);
      return <View testID="a-b" />;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('a-index')).toBeVisible();
  expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
  expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/index-\w+/);
  expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/a-\w+/);

  const indexTabKey = BottomTabsScreen.mock.calls[0][0].tabKey;
  const aTabKey = BottomTabsScreen.mock.calls[1][0].tabKey;

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aBTabPressHandler).toHaveBeenCalledTimes(0);

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: indexTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(1);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: aTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  // The events are only emitted in tabs, so they are not propagated to stack children
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aBTabPressHandler).toHaveBeenCalledTimes(0);

  act(() => {
    router.push('/a/b');
  });

  expect(screen.getByTestId('a-b')).toBeVisible();

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      tabKey: aTabKey,
    },
  } as NativeSyntheticEvent<{ tabKey: string }>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aBTabPressHandler).toHaveBeenCalledTimes(0);

  expect(screen).toHavePathname('/a/b');
});
