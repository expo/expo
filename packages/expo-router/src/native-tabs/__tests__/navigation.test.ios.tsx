import { screen, fireEvent } from '@testing-library/react-native';
import { act, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'react-native-screens';

import { router } from '../../imperative-api';
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
  function expectOneRender() {
    expect(TabsScreen).toHaveBeenCalledTimes(2);
  }

  function expectTwoRenders() {
    expect(TabsScreen).toHaveBeenCalledTimes(4);
  }

  function lastHostSelectedKey() {
    const calls = TabsHost.mock.calls;
    return calls[calls.length - 1][0].navStateRequest.selectedScreenKey;
  }

  function expectIndexTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toMatch(
      /^second-[-\w]+/
    );
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
  }

  function expectSecondTabFocused(renderNumber = 1) {
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2][0].screenKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[(renderNumber - 1) * 2 + 1][0].screenKey).toMatch(
      /^second-[-\w]+/
    );
    expect(lastHostSelectedKey()).toMatch(/^second-[-\w]+/);
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
    expectOneRender();
    expectIndexTabFocused();
    TabsScreen.mockClear();
  });

  it('can navigate using router.push', () => {
    act(() => router.push('/second'));
    expectTwoRenders();
    expectSecondTabFocused(2);
    TabsScreen.mockClear();
    act(() => router.push('/'));
    expectTwoRenders();
    expectIndexTabFocused(2);
  });

  it('can navigate using Link', () => {
    act(() => fireEvent.press(screen.getByTestId('index-second-link')));

    // First render is deferred index=0, index =1
    // Second one is deferred index=1, index =1
    expectTwoRenders();
    expectSecondTabFocused(2);
    TabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-index-link')));
    expectTwoRenders();
    expectIndexTabFocused(2);
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
    expectSecondTabFocused(2);

    TabsScreen.mockClear();
    act(() => fireEvent.press(screen.getByTestId('second-second-link'))); // link to same tab
    expectOneRender();
    expectSecondTabFocused();
  });

  it('when Link is pressed to a hidden tab, it redirects to the initial tab', async () => {
    act(() => fireEvent.press(screen.getByTestId('index-hidden-link')));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');

    TabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused(2);

    act(() => fireEvent.press(screen.getByTestId('second-hidden-link')));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');
  });

  it('when Link is pressed to a not-specified tab, it redirects to the initial tab', () => {
    act(() => fireEvent.press(screen.getByTestId('index-not-specified-link')));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');

    TabsScreen.mockClear();
    act(() => router.push('/second'));
    expectSecondTabFocused();

    act(() => fireEvent.press(screen.getByTestId('second-not-specified-link')));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');
  });

  it('redirects to the initial tab when router.push targets a hidden or not-specified route', () => {
    act(() => router.push('/hidden'));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');

    act(() => router.push('/notSpecified'));
    expect(lastHostSelectedKey()).toMatch(/^index-[-\w]+/);
    expect(screen).toHavePathname('/');
  });
});

describe('Native Bottom Tabs trigger changes', () => {
  it('renders only routes with visible triggers', () => {
    renderRouter({
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
    expect(TabsScreen.mock.calls[0]![0].screenKey).toMatch(/^index-[-\w]+/);
  });

  it('removes a tab item when its trigger is removed and redirects navigation to it', () => {
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
    renderRouter({
      _layout: Layout,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });
    TabsScreen.mockClear();
    act(() => setShowSecond(false));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0]![0].screenKey).toMatch(/^index-[-\w]+/);

    act(() => router.push('/second'));
    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('redirects to the initial tab when deep linking to a route without a visible tab', () => {
    renderRouter(
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

  it('respects initialRouteName when redirecting from a route without a visible tab', () => {
    renderRouter(
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

  it('respects an initialRouteName that targets a directory index route', () => {
    renderRouter(
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

  it('shows and navigates a tab whose trigger names a directory index route', () => {
    renderRouter({
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
    expect(TabsScreen).toHaveBeenCalledTimes(2);

    act(() => router.push('/second'));

    expect(screen).toHavePathname('/second');
    expect(screen.getByTestId('second')).toBeVisible();
  });

  it('redirects to the initial tab when the focused trigger is hidden dynamically', () => {
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
    renderRouter({
      _layout: Layout,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.push('/second'));
    expect(screen).toHavePathname('/second');

    TabsScreen.mockClear();
    act(() => setHidden(true));

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).toHaveBeenCalled();
    for (const call of TabsScreen.mock.calls) {
      expect(call[0].screenKey).toMatch(/^index-[-\w]+/);
    }
  });

  it('renders no tab UI when every trigger is hidden', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" hidden />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.queryByTestId('index')).toBeNull();
    expect(TabsScreen).not.toHaveBeenCalled();
  });
});
