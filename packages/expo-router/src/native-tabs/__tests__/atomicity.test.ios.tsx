import { screen } from '@testing-library/react-native';
import React from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import {
  Tabs,
  type TabSelectedEvent,
  type TabsHostProps,
  // @ts-expect-error: method is declared in the mock below
  __triggerTabSelected,
} from 'react-native-screens';

import * as navReducerModule from '../../global-state/navigation-store/navReducer';
import { router } from '../../imperative-api';
import { act, renderRouter } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  let triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = () => {};
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children, onTabSelected }) => {
        triggerTabSelected = onTabSelected || (() => {});
        return <View testID="TabsHost">{children}</View>;
      }),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
    __triggerTabSelected: (event: Parameters<NonNullable<TabsHostProps['onTabSelected']>>[0]) =>
      triggerTabSelected(event),
  };
});

const triggerNativeFocusChange: NonNullable<TabsHostProps['onTabSelected']> = (event) =>
  act(() => {
    __triggerTabSelected(event);
  });

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

// Count REPLACE_ROOT reducer commits. The spy must be installed before render so the reference
// `useReducer` captures at mount is the spy. One logical navigation must yield exactly one commit.
let reducerSpy: jest.SpyInstance;
function replaceRootCount() {
  return reducerSpy.mock.calls.filter(([, action]) => action?.type === 'REPLACE_ROOT').length;
}

beforeEach(() => {
  jest.useFakeTimers();
  reducerSpy = jest.spyOn(navReducerModule, 'navReducer');
});
afterEach(() => {
  reducerSpy.mockRestore();
  jest.useRealTimers();
});

function renderTwoTabs() {
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
  // Tabs render in declaration order; read their native screen keys.
  const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;
  const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;
  return { indexTabKey, secondTabKey };
}

const nativeTabEvent = (
  selectedScreenKey: string,
  actionOrigin: 'user' | 'programmatic-js'
): NativeSyntheticEvent<TabSelectedEvent> =>
  ({
    nativeEvent: {
      selectedScreenKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin,
    },
  }) as NativeSyntheticEvent<TabSelectedEvent>;

describe('NativeTabs commit atomicity', () => {
  it('a native tab press (JUMP_TO) produces exactly one REPLACE_ROOT commit', () => {
    const { secondTabKey } = renderTwoTabs();
    reducerSpy.mockClear();

    triggerNativeFocusChange(nativeTabEvent(secondTabKey, 'user'));
    act(() => jest.runAllTimers());

    expect(replaceRootCount()).toBe(1);
    expect(screen).toHavePathname('/second');
  });

  it('a cross-tab router.navigate commits the navigation as a single REPLACE_ROOT', () => {
    renderTwoTabs();
    reducerSpy.mockClear();

    act(() => router.navigate('/second'));
    act(() => jest.runAllTimers());

    // NAVIGATE has shouldActionChangeFocus=true (unlike JUMP_TO), so it can drive an ancestor focus
    // cascade. The navigation action commits as one tree. (This asserts the end-state invariant for
    // the navigation itself; lazily-revealed nested navigators bootstrap in their own later commit,
    // and this shallow fixture doesn't isolate the batch's specific contribution.)
    expect(replaceRootCount()).toBe(1);
    expect(screen).toHavePathname('/second');
  });
});

describe('NativeTabs native<->JS echo guard', () => {
  it('swallows a programmatic-js tab selection (no tabPress, no commit)', () => {
    const indexTabPress = jest.fn();
    const secondTabPress = jest.fn();
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: function Index() {
        const navigation = useNavigation();
        React.useEffect(
          // @ts-expect-error: tabPress is only typed on tab navigators
          () => navigation.addListener('tabPress', indexTabPress),
          [navigation]
        );
        return <View testID="index" />;
      },
      second: function Second() {
        const navigation = useNavigation();
        React.useEffect(
          // @ts-expect-error: tabPress is only typed on tab navigators
          () => navigation.addListener('tabPress', secondTabPress),
          [navigation]
        );
        return <View testID="second" />;
      },
    });
    const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;
    reducerSpy.mockClear();

    // A programmatic-js event is the echo of a JS-driven selection coming back from native; it must
    // not be re-interpreted as a fresh native action, or native<->JS would loop.
    triggerNativeFocusChange(nativeTabEvent(secondTabKey, 'programmatic-js'));
    act(() => jest.runAllTimers());

    expect(secondTabPress).toHaveBeenCalledTimes(0);
    expect(indexTabPress).toHaveBeenCalledTimes(0);
    expect(replaceRootCount()).toBe(0);

    // A real user selection of the same tab, by contrast, does emit tabPress.
    triggerNativeFocusChange(nativeTabEvent(secondTabKey, 'user'));
    act(() => jest.runAllTimers());
    expect(secondTabPress).toHaveBeenCalledTimes(1);
  });
});
