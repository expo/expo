import { View, type NativeSyntheticEvent } from 'react-native';
import {
  Tabs as _Tabs,
  type TabSelectedEvent,
  type TabsHostProps,
  // @ts-expect-error: method is declared in mock below
  __triggerTabSelected,
} from 'react-native-screens';

import { act, renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  let triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = () => {};
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    Tabs: {
      ...actualScreens.Tabs,
      Host: jest.fn(({ children, onTabSelected }) => {
        triggerTabSelected = onTabSelected || (() => {});
        return <View testID="Tabs">{children}</View>;
      }),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
    __triggerTabSelected: (event: Parameters<NonNullable<TabsHostProps['onTabSelected']>>[0]) =>
      triggerTabSelected(event),
  };
});

const triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = (event) =>
  act(() => {
    __triggerTabSelected(event);
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

function tabSelectedEvent(selectedScreenKey: string): NativeSyntheticEvent<TabSelectedEvent> {
  return {
    nativeEvent: {
      selectedScreenKey,
      provenance: 0,
      isRepeated: false,
      hasTriggeredSpecialEffect: false,
      actionOrigin: 'user',
    },
  } as NativeSyntheticEvent<TabSelectedEvent>;
}

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

    const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;

    triggerTabSelected(tabSelectedEvent(indexTabKey));

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

    const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;

    triggerTabSelected(tabSelectedEvent(indexTabKey));

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

    const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;

    triggerTabSelected(tabSelectedEvent(secondTabKey));

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

    const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;
    const secondTabKey = TabsScreen.mock.calls[1][0].screenKey;

    triggerTabSelected(tabSelectedEvent(indexTabKey));

    act(() => jest.runAllTimers());
    expect(screenListener).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    triggerTabSelected(tabSelectedEvent(secondTabKey));

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

    const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;

    triggerTabSelected(tabSelectedEvent(indexTabKey));

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

    const indexTabKey = TabsScreen.mock.calls[0][0].screenKey;

    triggerTabSelected(tabSelectedEvent(indexTabKey));

    act(() => jest.runAllTimers());

    expect(screenListener).toHaveBeenCalledTimes(1);
    expect(triggerListener).toHaveBeenCalledTimes(1);
  });
});
