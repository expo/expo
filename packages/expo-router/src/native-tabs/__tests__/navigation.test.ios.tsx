import { screen, fireEvent } from '@testing-library/react-native';
import { act, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'react-native-screens';

import { router } from '../../imperative-api';
import Stack from '../../layouts/StackClient';
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
    ScreenStackItem: jest.fn(({ children }) => <View>{children}</View>),
    Tabs: {
      ...actualModule.Tabs,
      Host: jest.fn(({ children }) => <View testID="TabsHost">{children}</View>),
      Screen: jest.fn(({ children }) => <View testID="TabsScreen">{children}</View>),
    },
  };
});

const TabsHost = Tabs.Host as jest.MockedFunction<typeof Tabs.Host>;
const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;

afterEach(() => router.setTransitionMode('preload-only'));

describe('Native Bottom Tabs Navigation', () => {
  function expectOneRender() {
    expect(TabsScreen).toHaveBeenCalledTimes(2);
  }

  function lastHostSelectedKey() {
    const calls = TabsHost.mock.calls;
    return calls[calls.length - 1][0].navStateRequest.selectedScreenKey;
  }

  function expectIndexTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toBe('index');
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toBe('second');
    expect(lastHostSelectedKey()).toBe('index');
  }

  function expectSecondTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toBe('index');
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toBe('second');
    expect(lastHostSelectedKey()).toBe('second');
  }

  beforeEach(async () => {
    await renderRouter({
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
          <Link href="/notSpecified" testID="index-not-specified-link" />
        </View>
      ),
      second: () => (
        <View testID="second">
          <Link href="/" testID="second-index-link" />
          <Link href="/second" testID="second-second-link" />
          <Link href="/hidden" testID="second-hidden-link" />
          <Link href="/notSpecified" testID="second-not-specified-link" />
        </View>
      ),
      hidden: () => <View testID="hidden" />,
      notSpecified: () => <View testID="not-specified" />,
    });
    expect(TabsScreen).toHaveBeenCalledTimes(4);
    expectIndexTabFocused();
    await act(() => router.setTransitionMode('always'));
    TabsScreen.mockClear();
  });

  it('can navigate using router.push', async () => {
    await act(() => router.push('/second'));
    expectOneRender();
    expectSecondTabFocused();
    TabsScreen.mockClear();
    await act(() => router.push('/'));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('can navigate using Link', async () => {
    await act(() => fireEvent.press(screen.getByTestId('index-second-link')));

    expectOneRender();
    expectSecondTabFocused();
    TabsScreen.mockClear();
    await act(() => fireEvent.press(screen.getByTestId('second-index-link')));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('does not re-render when router.push is called to the same tab', async () => {
    await act(() => router.push('/'));
    expectOneRender();
    expectIndexTabFocused();
  });

  it('re-renders when Link is pressed to the same tab', async () => {
    await act(() => fireEvent.press(screen.getByTestId('index-index-link'))); // link to same tab
    expectOneRender();
    expectIndexTabFocused();

    TabsScreen.mockClear();
    await act(() => router.push('/second'));
    expectSecondTabFocused();

    TabsScreen.mockClear();
    await act(() => fireEvent.press(screen.getByTestId('second-second-link'))); // link to same tab
    expectOneRender();
    expectSecondTabFocused();
  });

  it('when Link is pressed to a hidden tab, it redirects to the initial tab', async () => {
    await act(() => fireEvent.press(screen.getByTestId('index-hidden-link')));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');

    TabsScreen.mockClear();
    await act(() => router.push('/second'));
    expectSecondTabFocused();

    await act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');
  });

  it('when Link is pressed to a not-specified tab, it redirects to the initial tab', async () => {
    await act(() => fireEvent.press(screen.getByTestId('index-not-specified-link')));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');

    TabsScreen.mockClear();
    await act(() => router.push('/second'));
    expectSecondTabFocused();

    await act(() => fireEvent.press(screen.getByTestId('second-not-specified-link')));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');
  });

  it('redirects to the initial tab when router.push targets a hidden or not-specified route', async () => {
    await act(() => router.push('/hidden'));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');

    await act(() => router.push('/notSpecified'));
    expect(lastHostSelectedKey()).toBe('index');
    expect(screen).toHavePathname('/');
  });
});

describe('Native Bottom Tabs trigger changes', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders only routes with visible triggers', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="hidden" hidden />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      hidden: () => <View testID="hidden" />,
      notSpecified: () => <View testID="not-specified" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('hidden')).toBeNull();
    expect(screen.queryByTestId('not-specified')).toBeNull();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0]![0].screenKey).toBe('index');
  });

  it('removes a tab item when its trigger is removed and redirects navigation to it', async () => {
    let setShowSecond!: (show: boolean) => void;
    function Layout() {
      const [showSecond, set] = useState(true);
      setShowSecond = set;
      return (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          {showSecond && <NativeTabs.Trigger name="second" />}
        </NativeTabs>
      );
    }
    await renderRouter({
      _layout: Layout,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });
    TabsScreen.mockClear();
    await act(() => setShowSecond(false));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0]![0].screenKey).toBe('index');

    await act(() => router.push('/second'));
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('redirects to the initial tab when deep linking to a route without a visible tab', async () => {
    await renderRouter(
      {
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        notSpecified: () => <View testID="not-specified" />,
      },
      { initialUrl: '/notSpecified' }
    );

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('not-specified')).toBeNull();
    expect(screen).toHavePathname('/');
  });

  it('removes a replaced route from tab history', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs backBehavior="history">
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      notSpecified: () => <View testID="not-specified" />,
    });

    await act(() => router.push('/second'));
    await act(() => router.push('/notSpecified'));
    expect(screen).toHavePathname('/');

    await act(() => router.back());
    expect(screen).toHavePathname('/second');
  });

  it('respects initialRouteName when redirecting from a route without a visible tab', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { initialRouteName: 'second' },
          default: () => (
            <NativeTabs>
              <NativeTabs.Trigger name="index" />
              <NativeTabs.Trigger name="second" />
            </NativeTabs>
          ),
        },
        index: () => <View testID="index" />,
        second: () => <View testID="second" />,
        notSpecified: () => <View testID="not-specified" />,
      },
      { initialUrl: '/notSpecified' }
    );

    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen.queryByTestId('not-specified')).toBeNull();
    expect(screen).toHavePathname('/second');
  });

  it('respects an initialRouteName that targets a directory index route', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { initialRouteName: 'second/index' },
          default: () => (
            <NativeTabs>
              <NativeTabs.Trigger name="index" />
              <NativeTabs.Trigger name="second" />
            </NativeTabs>
          ),
        },
        index: () => <View testID="index" />,
        'second/index': () => <View testID="second" />,
        notSpecified: () => <View testID="not-specified" />,
      },
      { initialUrl: '/notSpecified' }
    );

    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen).toHavePathname('/second');
  });

  it('shows and navigates a tab whose trigger names a directory index route', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      'second/index': () => <View testID="second" />,
    });

    // The trigger name `second` matches the route `second/index`.
    expect(TabsScreen).toHaveBeenCalledTimes(4);

    await act(() => router.push('/second'));

    expect(screen).toHavePathname('/second');
    expect(screen.getByTestId('second')).toBeVisible();
  });

  it('redirects to the initial tab when the focused trigger is hidden dynamically', async () => {
    let setHidden!: (hidden: boolean) => void;
    function Layout() {
      const [hidden, set] = useState(false);
      setHidden = set;
      return (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" hidden={hidden} />
        </NativeTabs>
      );
    }
    await renderRouter({
      _layout: Layout,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    await act(() => router.push('/second'));
    expect(screen).toHavePathname('/second');

    TabsScreen.mockClear();
    await act(() => setHidden(true));

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).toHaveBeenCalled();
    for (const call of TabsScreen.mock.calls) {
      expect(call[0].screenKey).toBe('index');
    }
  });

  it('waits for a nested native tabs navigator to regain focus before redirecting', async () => {
    let setHidden!: (hidden: boolean) => void;
    function TabsLayout() {
      const [hidden, set] = useState(false);
      setHidden = set;
      return (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" hidden={hidden} />
        </NativeTabs>
      );
    }
    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <View testID="outside" />,
        'tabs/_layout': TabsLayout,
        'tabs/index': () => <View testID="tabs-index" />,
        'tabs/second': () => <View testID="tabs-second" />,
      },
      { initialUrl: '/tabs/second' }
    );

    await act(() => router.push('/'));
    await act(() => setHidden(true));

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('outside')).toBeVisible();

    await act(() => router.back());

    expect(screen).toHavePathname('/tabs');
    expect(screen.getByTestId('tabs-index')).toBeVisible();
  });

  it('renders no tab UI when every trigger is hidden', async () => {
    await renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" hidden />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.queryByTestId('index')).toBeNull();
    expect(TabsScreen).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });
});
