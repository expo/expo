import { act, fireEvent, screen } from '@testing-library/react-native';
import { Button, Text } from 'react-native';

import { router } from '../../../imperative-api';
import type { BackBehavior } from '../../../react-navigation/routers/TabRouter';
import { renderRouter } from '../../../testing-library';
import { useNavigation } from '../../../useNavigation';
import { Drawer, useDrawerStatus } from '../../Drawer';

jest.mock('react-native-drawer-layout', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const actual = jest.requireActual(
    'react-native-drawer-layout'
  ) as typeof import('react-native-drawer-layout');
  return {
    ...actual,
    Drawer: ({ children }: React.PropsWithChildren) =>
      React.createElement(React.Fragment, null, children),
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
    <Drawer backBehavior={backBehavior}>
      <Drawer.Screen name="index" />
      <Drawer.Screen name="second" />
      <Drawer.Screen name="third" />
    </Drawer>
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

describe('Drawer backBehavior', () => {
  it('returns to the first route by default', () => {
    renderTabs();
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 0, third: 0 });
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
      expectRenders({ index: 1, second: 0, third: 0 });
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
      expectRenders({ index: 0, second: 0, third: 1 });
      act(() => router.back());
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(false);
      expectRenders({ index: 1, second: 0, third: 0 });
    });
  });

  describe('initialRoute', () => {
    it('returns to the configured initial route after navigation', () => {
      renderTabs('initialRoute', { initialRouteName: 'second' });
      expectFocused('/', 'index');
      expect(router.canGoBack()).toBe(true);
      expectRenders({ index: 1, second: 1, third: 0 });
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
      expectRenders({ index: 0, second: 1, third: 1 });
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
    expectRenders({ index: 1, second: 0, third: 0 });
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
    expectRenders({ index: 1, second: 0, third: 0 });
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
    expectRenders({ index: 1, second: 0, third: 0 });
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

  it('closes an open drawer before following the configured behavior', () => {
    function DrawerScreen() {
      // The root navigation type does not include helpers added by the Drawer navigator.
      const navigation = useNavigation() as ReturnType<typeof useNavigation> & {
        openDrawer(): void;
      };
      return (
        <>
          <Text testID="drawer-status">{useDrawerStatus()}</Text>
          <Button title="open drawer" onPress={() => navigation.openDrawer()} />
        </>
      );
    }

    renderRouter({
      _layout: () => (
        <Drawer>
          <Drawer.Screen name="index" />
          <Drawer.Screen name="second" />
        </Drawer>
      ),
      index: IndexTab,
      second: DrawerScreen,
    });
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
    expectRenders({ index: 1, second: 0, third: 0 });
    act(() => router.push('/second'));
    expectFocused('/second', 'drawer-status');
    expect(router.canGoBack()).toBe(true);
    expectRenders({ index: 0, second: 0, third: 0 });

    fireEvent.press(screen.getByText('open drawer'));
    expect(screen.getByTestId('drawer-status')).toHaveTextContent('open');
    act(() => router.back());
    expectFocused('/second', 'drawer-status');
    expect(screen.getByTestId('drawer-status')).toHaveTextContent('closed');
    expect(router.canGoBack()).toBe(true);
    act(() => router.back());
    expectFocused('/', 'index');
    expect(router.canGoBack()).toBe(false);
  });
});
