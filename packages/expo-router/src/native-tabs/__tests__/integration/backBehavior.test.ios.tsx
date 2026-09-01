import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../../imperative-api';
import type { BackBehavior } from '../../../react-navigation/routers/TabRouter';
import { renderRouter } from '../../../testing-library';
import { NativeTabs } from '../../NativeTabs';
import type { NativeTabsProps } from '../../types';

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

const IndexTab = jest.fn(() => <Text testID="index">index</Text>);
const SecondTab = jest.fn(() => <Text testID="second">second</Text>);
const ThirdTab = jest.fn(() => <Text testID="third">third</Text>);

type RenderCounts = { index: number; second: number; third: number };

function renderTabs(
  backBehavior?: BackBehavior,
  { initialUrl = '/', initialRouteName }: { initialUrl?: string; initialRouteName?: string } = {}
) {
  const Layout = () => (
    // Native tabs uses all `TabRouter` values internally, but its public type omits these iOS tests' values.
    <NativeTabs backBehavior={backBehavior as NativeTabsProps['backBehavior']}>
      <NativeTabs.Trigger name="index" />
      <NativeTabs.Trigger name="second" />
      <NativeTabs.Trigger name="third" />
    </NativeTabs>
  );

  renderRouter(
    {
      _layout: { unstable_settings: { initialRouteName }, default: Layout },
      index: IndexTab,
      second: SecondTab,
      third: ThirdTab,
    },
    { initialUrl }
  );
}

function expectRenders({ index, second, third }: RenderCounts) {
  expect(IndexTab).toHaveBeenCalledTimes(index);
  expect(SecondTab).toHaveBeenCalledTimes(second);
  expect(ThirdTab).toHaveBeenCalledTimes(third);
  jest.clearAllMocks();
}

function expectFocused(pathname: string, testID: string) {
  expect(screen).toHavePathname(pathname);
  expect(screen.getByTestId(testID)).toBeVisible();
}

describe('NativeTabs backBehavior', () => {
  it('returns to the first route by default', () => {
    renderTabs();
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 1, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.push('/third'));
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 1 });

    act(() => router.back());
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 0, third: 0 });
  });

  describe('firstRoute', () => {
    it('returns to the first route after navigation', () => {
      renderTabs('firstRoute');
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 1, second: 1, third: 1 });

      act(() => router.push('/second'));
      expectFocused('/second', 'second');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 0, second: 1, third: 0 });

      act(() => router.push('/third'));
      expectFocused('/third', 'third');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 0, second: 0, third: 1 });

      act(() => router.back());
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 0, second: 0, third: 0 });
    });

    it('creates the first route when the app starts on another route', () => {
      renderTabs('firstRoute', { initialUrl: '/third' });
      expectFocused('/third', 'third');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 1, second: 1, third: 1 });

      act(() => router.back());
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 0, second: 0, third: 0 });
    });
  });

  describe('initialRoute', () => {
    it('returns to the configured initial route after navigation', () => {
      renderTabs('initialRoute', { initialRouteName: 'second' });
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 1, second: 1, third: 1 });

      act(() => router.push('/third'));
      expectFocused('/third', 'third');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 0, second: 0, third: 1 });

      act(() => router.back());
      expectFocused('/second', 'second');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 0, second: 0, third: 0 });
    });

    it('creates the configured initial route when the app starts on another route', () => {
      renderTabs('initialRoute', {
        initialUrl: '/third',
        initialRouteName: 'second',
      });
      expectFocused('/third', 'third');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 1, second: 1, third: 1 });

      act(() => router.back());
      expectFocused('/second', 'second');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 0, second: 0, third: 0 });
    });
  });

  it('follows route order', () => {
    renderTabs('order');
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 1, third: 1 });

    act(() => router.push('/third'));
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 1 });

    act(() => router.back());
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 0 });

    act(() => router.back());
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 0, third: 0 });
  });

  it('keeps only the latest visit to each route in history', () => {
    renderTabs('history');
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 1, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.push('/third'));
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.back());
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 0 });

    act(() => router.back());
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 0, third: 0 });
  });

  it('keeps duplicate visits in full history', () => {
    renderTabs('fullHistory');
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 1, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.push('/third'));
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.back());
    expectFocused('/third', 'third');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 1 });

    act(() => router.back());
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.back());
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 0, third: 0 });
  });

  it('does not handle back actions with none', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    renderTabs('none');
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 1, third: 1 });

    act(() => router.push('/second'));
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 1, third: 0 });

    act(() => router.back());
    expectFocused('/second', 'second');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 0, second: 0, third: 0 });
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
