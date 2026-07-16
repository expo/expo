import { screen } from '@testing-library/react-native';
import React from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import {
  Tabs,
  type TabSelectedEvent,
  type TabsHostProps,
  // @ts-expect-error: method is declared in mock below
  __triggerTabSelected,
  // @ts-expect-error: method is declared in mock below
  __triggerTabSelectionPrevented,
} from 'react-native-screens';

import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
import { act, renderRouter } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import { NativeTabs } from '../NativeTabs';

// `TabSelectionPreventedEvent` is not re-exported from the package root in
// react-native-screens@4.25.2, so derive its payload from the callback prop.
type TabSelectionPreventedNativeEvent = Parameters<
  NonNullable<TabsHostProps['onTabSelectionPrevented']>
>[0];

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  let triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = () => {};
  let triggerTabSelectionPrevented: NonNullable<
    TabsHostProps['onTabSelectionPrevented']
  > = () => {};
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children, onTabSelected, onTabSelectionPrevented }) => {
        triggerTabSelected = onTabSelected || (() => {});
        triggerTabSelectionPrevented = onTabSelectionPrevented || (() => {});
        return <View testID="TabsHost">{children}</View>;
      }),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
    __triggerTabSelected: (event: Parameters<NonNullable<TabsHostProps['onTabSelected']>>[0]) =>
      triggerTabSelected(event),
    __triggerTabSelectionPrevented: (event: TabSelectionPreventedNativeEvent) =>
      triggerTabSelectionPrevented(event),
  };
});

const triggerNativeFocusChange: NonNullable<TabsHostProps['onTabSelected']> = (event) =>
  act(() => {
    __triggerTabSelected(event);
  });

const triggerTabSelectionPrevented: NonNullable<TabsHostProps['onTabSelectionPrevented']> = (
  event
) =>
  act(() => {
    __triggerTabSelectionPrevented(event);
  });

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

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
  // Eager preload renders both tabs twice; order is preserved within each pass.
  expect(TabsScreen).toHaveBeenCalledTimes(4);
  expect(TabsScreen.mock.calls[0][0].screenKey).toMatch(/(^|:)index:\d+$/);
  expect(TabsScreen.mock.calls[1][0].screenKey).toMatch(/(^|:)second:\d+$/);

  const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;
  const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(0);

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: indexTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(1);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: secondTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(1);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: secondTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

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
  // Eager preload renders both tabs; the preloaded `a` tab's nested Stack has no compiled slice
  // yet, so it seeds its initial state into the store on mount (one extra commit) and renders an
  // additional pass.
  expect(TabsScreen).toHaveBeenCalledTimes(6);
  expect(TabsScreen.mock.calls[0][0].screenKey).toMatch(/(^|:)index:\d+$/);
  expect(TabsScreen.mock.calls[1][0].screenKey).toMatch(/(^|:)a:\d+$/);

  const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;
  const aTabKey = TabsScreen.mock.calls[1][0].screenKey;

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aBTabPressHandler).toHaveBeenCalledTimes(0);

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: indexTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(1);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: aTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

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
      selectedScreenKey: aTabKey,
      provenance: 0,
      isRepeated: true,
      hasTriggeredSpecialEffect: true,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

  act(() => jest.runAllTimers());

  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aIndexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(aBTabPressHandler).toHaveBeenCalledTimes(0);

  expect(screen).toHavePathname('/a/b');
});

it('emits tabPress with isPrevented and does not navigate when a disabled tab is tapped', () => {
  const indexTabPressHandler = jest.fn();
  const secondTabPressHandler = jest.fn();
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" disabled />
      </NativeTabs>
    ),
    index: function Index() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', (e) => {
          indexTabPressHandler(e);
        });
      }, [navigation]);
      return <View testID="index" />;
    },
    second: function Second() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', (e) => {
          secondTabPressHandler(e);
        });
      }, [navigation]);
      return <View testID="second" />;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('second')).toBeVisible();
  // Eager preload renders both tabs twice; order is preserved within each pass.
  expect(TabsScreen).toHaveBeenCalledTimes(4);

  const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;
  const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;

  expect(screen).toHavePathname('/');
  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  expect(secondTabPressHandler).toHaveBeenCalledTimes(0);

  triggerTabSelectionPrevented({
    nativeEvent: {
      // `selectedScreenKey` is the still-active tab; `preventedScreenKey` is the disabled tab tapped.
      selectedScreenKey: indexTabKey,
      provenance: 0,
      preventedScreenKey: secondTabKey,
    },
  } as TabSelectionPreventedNativeEvent);

  act(() => jest.runAllTimers());

  // The prevented (disabled) tab's listener fires; the focused tab's does not (target isolation).
  expect(secondTabPressHandler).toHaveBeenCalledTimes(1);
  expect(indexTabPressHandler).toHaveBeenCalledTimes(0);
  // The event carries the `isPrevented` flag in its data.
  expect(secondTabPressHandler.mock.calls[0][0].data).toEqual({
    __internalTabsType: 'native',
    isPrevented: true,
  });
  // Navigation did not change — JUMP_TO was skipped.
  expect(screen).toHavePathname('/');
});

it('emits tabPress with isPrevented false on a normal native selection', () => {
  const secondTabPressHandler = jest.fn();
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="second" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
    second: function Second() {
      const navigation = useNavigation();
      React.useEffect(() => {
        // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
        return navigation.addListener('tabPress', (e) => {
          secondTabPressHandler(e);
        });
      }, [navigation]);
      return <View testID="second" />;
    },
  });

  const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;

  triggerNativeFocusChange({
    nativeEvent: {
      selectedScreenKey: secondTabKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>);

  act(() => jest.runAllTimers());

  expect(secondTabPressHandler).toHaveBeenCalledTimes(1);
  expect(secondTabPressHandler.mock.calls[0][0].data).toEqual({
    __internalTabsType: 'native',
    isPrevented: false,
  });
  expect(screen).toHavePathname('/second');
});
