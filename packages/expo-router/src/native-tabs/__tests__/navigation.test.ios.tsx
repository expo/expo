import { screen, fireEvent } from '@testing-library/react-native';
import { act } from 'react';
import { View } from 'react-native';
import { Tabs } from 'react-native-screens';

import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { Link } from '../../link/Link';
import { renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actualModule = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualModule,
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

const TabsHost = Tabs.Host as jest.MockedFunction<typeof Tabs.Host>;
const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

describe('Native Bottom Tabs Navigation', () => {
  function expectNoRenders() {
    expect(TabsScreen).not.toHaveBeenCalled();
  }

  function expectOneRender() {
    expect(TabsScreen).toHaveBeenCalledTimes(2);
  }

  function lastHostSelectedKey() {
    const calls = TabsHost.mock.calls;
    return calls[calls.length - 1][0].navStateRequest.selectedScreenKey;
  }

  function expectIndexTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toMatch(/(^|:)index:\d+$/);
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toMatch(
      /(^|:)second:\d+$/
    );
    expect(lastHostSelectedKey()).toMatch(/(^|:)index:\d+$/);
  }

  function expectSecondTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toMatch(/(^|:)index:\d+$/);
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toMatch(
      /(^|:)second:\d+$/
    );
    expect(lastHostSelectedKey()).toMatch(/(^|:)second:\d+$/);
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
    // 2 visible tabs, rendered across three commit passes: the initial seed pass, the deferred
    // `RECONCILE_ROUTE_NAMES` pass (the trigger-only route-names subset reconciles through the root
    // reducer as its own commit under the flip), and the eager-preload pass. 2 tabs x 3 passes.
    expect(TabsScreen).toHaveBeenCalledTimes(6);
    expectIndexTabFocused();
    TabsScreen.mockClear();
  });

  it('can navigate using router.push', () => {
    // Both tabs are eagerly preloaded (committed) after mount, so switching focus is a single
    // commit — one render pass of the two visible tabs — not a two-pass mount.
    act(() => router.push('/second'));
    expectOneRender();
    expectSecondTabFocused();
    TabsScreen.mockClear();
    act(() => router.push('/'));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('can navigate using Link', () => {
    act(() => fireEvent.press(screen.getByTestId('index-second-link')));
    expectOneRender();
    expectSecondTabFocused();
    TabsScreen.mockClear();
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

    TabsScreen.mockClear();
    act(() => router.push('/second'));
    expectOneRender();
    expectSecondTabFocused();

    TabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-second-link'))); // link to same tab
    expectOneRender();
    expectSecondTabFocused();
  });

  it('when Link is pressed to a hidden tab, no navigation occurs', async () => {
    act(() => fireEvent.press(screen.getByTestId('index-hidden-link')));
    expectNoRenders();

    TabsScreen.mockClear();
    act(() => router.push('/second'));
    expectOneRender();
    expectSecondTabFocused();

    TabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expectNoRenders();
  });

  it('when Link is pressed to a not-specified tab, no navigation occurs', () => {
    act(() => fireEvent.press(screen.getByTestId('index-not-specified-link')));
    expectNoRenders();

    TabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused();

    TabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expectNoRenders();
  });
});

it('natively selects the compiler-derived route of an unvisited nested Stack tab', () => {
  renderRouter({
    _layout: () => (
      <NativeTabs>
        <NativeTabs.Trigger name="index" />
        <NativeTabs.Trigger name="stack" />
      </NativeTabs>
    ),
    index: () => <View testID="index" />,
    'stack/_layout': {
      unstable_settings: { initialRouteName: 'a' },
      default: () => <Stack />,
    },
    'stack/index': () => <View testID="stack-index" />,
    'stack/a': () => <View testID="stack-a" />,
  });

  const stackScreenKey = TabsScreen.mock.calls[1][0].screenKey;
  const onTabSelected = TabsHost.mock.calls.at(-1)![0].onTabSelected!;

  act(() => {
    onTabSelected({
      nativeEvent: { selectedScreenKey: stackScreenKey, provenance: 1, actionOrigin: 'user' },
    } as Parameters<typeof onTabSelected>[0]);
  });

  expect(screen.queryByTestId('stack-index')).toBeNull();
  expect(screen.getByTestId('stack-a')).toBeVisible();
});
