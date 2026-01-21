import { usePreventRemove } from '@react-navigation/core';
import { screen } from '@testing-library/react-native';
import React, { isValidElement } from 'react';
import { Button, View } from 'react-native';
import { Tabs } from 'react-native-screens';

import { usePathname } from '../../hooks';
import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import { Redirect } from '../../link/Redirect';
import { act, fireEvent, renderRouter } from '../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView } from '../NativeTabsView';
import { BottomAccessoryPlacementContext } from '../hooks';
import {
  SUPPORTED_BLUR_EFFECTS,
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
} from '../types';

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

jest.mock('../NativeTabsView', () => {
  const originalModule = jest.requireActual('../NativeTabsView');
  return {
    ...originalModule,
    NativeTabsView: jest.fn((props) => <originalModule.NativeTabsView {...props} />),
  };
});

const TabsScreen = Tabs.Screen as jest.MockedFunction<typeof Tabs.Screen>;
const TabsHost = Tabs.Host as jest.MockedFunction<typeof Tabs.Host>;

const warn = jest.fn();
const error = jest.fn();

const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = warn;
  console.error = error;
});
afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

it('renders tabs correctly', () => {
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

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('second')).toBeVisible();
  expect(TabsScreen).toHaveBeenCalledTimes(2);
});

describe('Tabs visibility', () => {
  it('does not render tab, when not specified', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen.queryByTestId('third')).toBeNull();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
  });

  it('does not render hidden tabs', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
          <NativeTabs.Trigger hidden name="fourth" />
          <NativeTabs.Trigger name="fifth" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
      fourth: () => <View testID="fourth" />,
      fifth: () => <View testID="fifth" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen.queryByTestId('third')).toBeNull();
    expect(screen.queryByTestId('fourth')).toBeNull();
    expect(screen.getByTestId('fifth')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(3);
  });

  it('does not render tabs, when route does not exist', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[Layout children]: Too many screens defined. Route "second" is extraneous.'
    );
  });
});

describe('First focused tab', () => {
  it('index tab is focused when it is first tab', () => {
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

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('index tab is focused when it is second tab', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="second" />
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^second-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^index-[-\w]+/);
  });

  describe('First tab is used, when index is hidden', () => {
    it('by not specifying an index route', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        first: () => <View testID="first" />,
        second: () => <View testID="second" />,
      });
    });

    it('by using hidden: true', () => {
      renderRouter({
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="index" hidden />
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
        first: () => <View testID="first" />,
        second: () => <View testID="second" />,
      });
    });

    afterEach(() => {
      expect(screen.getByTestId('first')).toBeVisible();
      expect(screen.getByTestId('second')).toBeVisible();
      expect(screen.queryByTestId('index')).toBeNull();
      expect(NativeTabsView).toHaveBeenCalledTimes(1);
    });
  });

  it('404 is shown, when index does not exist', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="first" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('expo-router-unmatched')).toBeVisible();
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).not.toHaveBeenCalled();
  });

  it('Correct tab is shown, when index is hidden and redirect is set in layout', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      index: () => <View testID="index" />,
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('first')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('Correct tab is shown, when index does not exist, redirect is set in layout and +not-found is specified', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      '+not-found': () => <View testID="not-found" />,
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('first')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
  });

  it('404 is shown, when index does not exist, redirect is set in layout and no +not-found is specified', () => {
    renderRouter({
      _layout: function Layout() {
        const pathname = usePathname();

        if (pathname === '/') {
          return <Redirect href="/second" />;
        }
        return (
          <NativeTabs>
            <NativeTabs.Trigger name="first" />
            <NativeTabs.Trigger name="second" />
          </NativeTabs>
        );
      },
      first: () => <View testID="first" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('expo-router-unmatched')).toBeVisible();
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(TabsScreen).not.toHaveBeenCalled();
  });

  it('Can remove the last tab, when it is focused', async () => {
    renderRouter({
      _layout: function Layout() {
        const [isSecondTabVisible, setIsSecondTabVisible] = React.useState(true);

        return (
          <>
            <Button
              testID="remove"
              title="Remove"
              onPress={() => {
                setIsSecondTabVisible(false);
              }}
            />
            <NativeTabs>
              <NativeTabs.Trigger name="index" />
              {isSecondTabVisible && <NativeTabs.Trigger name="second" />}
            </NativeTabs>
          </>
        );
      },
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);

    TabsScreen.mockClear();
    act(() => router.navigate('/second'));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(4);
    expect(TabsScreen.mock.calls[2][0].isFocused).toBe(false);
    expect(TabsScreen.mock.calls[2][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[3][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[3][0].tabKey).toMatch(/^second-[-\w]+/);

    TabsScreen.mockClear();
    act(() => {
      fireEvent.press(screen.getByTestId('remove'));
    });

    expect(screen.queryByTestId('second')).toBeNull();
    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(2);
    expect(TabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(TabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(TabsScreen.mock.calls[1][0].tabKey).toMatch(/^index-[-\w]+/);
  });
});

describe('Dynamic tab visibility remounting', () => {
  describe('Plain tabs structure', () => {
    it('navigator remounts when tab is hidden dynamically', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [isHidden, setIsHidden] = React.useState(false);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setIsHidden(!isHidden)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="second" hidden={isHidden} />
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        second: () => <ScreenWithMount testID="second" />,
      });

      // Initial mount - both screens mounted
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');

      // Clear mock and trigger state change (hide second tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - index remounts due to navigator remount
      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onMount).toHaveBeenCalledWith('index');
    });

    it('navigator remounts when tab is shown dynamically', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [isHidden, setIsHidden] = React.useState(true);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setIsHidden(!isHidden)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="second" hidden={isHidden} />
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        second: () => <ScreenWithMount testID="second" />,
      });

      // Initial mount - only index mounted (second is hidden)
      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onMount).toHaveBeenCalledWith('index');

      // Clear mock and trigger state change (show second tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - both screens mount after showing
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');
    });

    it('navigator remounts when tab Trigger is conditionally mounted', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [showThird, setShowThird] = React.useState(false);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setShowThird(!showThird)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="second" />
                {showThird && <NativeTabs.Trigger name="third" />}
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        second: () => <ScreenWithMount testID="second" />,
        third: () => <ScreenWithMount testID="third" />,
      });

      // Initial mount - two screens mounted
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');

      // Clear mock and trigger state change (add third tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - all screens remount when adding trigger
      expect(onMount).toHaveBeenCalledTimes(3);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');
      expect(onMount).toHaveBeenCalledWith('third');
    });

    it('navigator remounts when tab Trigger is conditionally unmounted', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [showThird, setShowThird] = React.useState(true);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setShowThird(!showThird)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="second" />
                {showThird && <NativeTabs.Trigger name="third" />}
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        second: () => <ScreenWithMount testID="second" />,
        third: () => <ScreenWithMount testID="third" />,
      });

      // Initial mount - three screens mounted
      expect(onMount).toHaveBeenCalledTimes(3);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');
      expect(onMount).toHaveBeenCalledWith('third');

      // Clear mock and trigger state change (remove third tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - remaining screens remount
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('second');
    });
  });

  describe('Stack nested inside tabs', () => {
    it('navigator remounts with nested Stack when tab is hidden', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [isHidden, setIsHidden] = React.useState(false);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setIsHidden(!isHidden)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="stack" />
                <NativeTabs.Trigger name="third" hidden={isHidden} />
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        'stack/_layout': () => <Stack />,
        'stack/index': () => <ScreenWithMount testID="stack-index" />,
        'stack/details': () => <ScreenWithMount testID="stack-details" />,
        third: () => <ScreenWithMount testID="third" />,
      });

      // Initial mount - index, stack-index, and third mounted
      expect(onMount).toHaveBeenCalledTimes(3);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');
      expect(onMount).toHaveBeenCalledWith('third');

      // Clear mock and trigger state change (hide third tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - Stack screens remount
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');
    });

    // TODO(@ubax): Investigate why this test fails in the test environment
    // When testing in the actual app, it works as expected.
    it.skip('Stack navigation state is reset when parent tabs remount', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [isHidden, setIsHidden] = React.useState(false);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setIsHidden(!isHidden)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="stack" />
                <NativeTabs.Trigger name="third" hidden={isHidden} />
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        'stack/_layout': () => <Stack />,
        'stack/index': () => (
          <>
            <ScreenWithMount testID="stack-index" />
            <Button
              testID="navigate-details"
              title="Navigate"
              onPress={() => router.navigate('/stack/details')}
            />
          </>
        ),
        'stack/details': () => <ScreenWithMount testID="stack-details" />,
        third: () => <ScreenWithMount testID="third" />,
      });

      // Initial mount
      expect(onMount).toHaveBeenCalledTimes(3);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');
      expect(onMount).toHaveBeenCalledWith('third');

      // Navigate to stack/details
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('navigate-details'));
      });

      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onMount).toHaveBeenCalledWith('stack-details');
      expect(screen.getByTestId('stack-details')).toBeVisible();

      // Clear mock and trigger state change (hide third tab)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      // Verify remount occurred - all Stack screens remount including details (state is restored)
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');
      expect(onMount).not.toHaveBeenCalledWith('stack-details');
      // stack-details should still be visible since navigation state is restored
      expect(screen.getByTestId('stack-index')).toBeVisible();
    });

    it('navigator remounts when focused nested Stack tab is hidden', () => {
      const onMount = jest.fn();

      function ScreenWithMount({ testID }: { testID: string }) {
        React.useEffect(() => {
          onMount(testID);
        }, []);
        return <View testID={testID} />;
      }

      renderRouter({
        _layout: function Layout() {
          const [isHidden, setIsHidden] = React.useState(false);
          return (
            <>
              <Button testID="toggle" title="Toggle" onPress={() => setIsHidden(!isHidden)} />
              <NativeTabs>
                <NativeTabs.Trigger name="index" />
                <NativeTabs.Trigger name="stack" hidden={isHidden} />
              </NativeTabs>
            </>
          );
        },
        index: () => <ScreenWithMount testID="index" />,
        'stack/_layout': () => <Stack />,
        'stack/index': () => (
          <>
            <ScreenWithMount testID="stack-index" />
            <Button
              testID="navigate-details"
              title="Navigate"
              onPress={() => router.navigate('/stack/details')}
            />
          </>
        ),
        'stack/details': () => <ScreenWithMount testID="stack-details" />,
      });

      // Initial mount - index and stack-index mounted
      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');

      // Navigate to stack tab and then to stack/details
      onMount.mockClear();
      act(() => {
        router.navigate('/stack');
      });
      act(() => {
        fireEvent.press(screen.getByTestId('navigate-details'));
      });

      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onMount).toHaveBeenCalledWith('stack-details');
      expect(screen.getByTestId('stack-details')).toBeVisible();

      // Clear mock and trigger state change (hide stack tab while focused on nested screen)
      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      expect(onMount).toHaveBeenCalledWith('index');
      expect(screen.queryByTestId('stack-details')).toBeNull();
      expect(screen.queryByTestId('stack-index')).toBeNull();
      expect(screen.getByTestId('index')).toBeVisible();

      onMount.mockClear();
      act(() => {
        fireEvent.press(screen.getByTestId('toggle'));
      });

      expect(onMount).toHaveBeenCalledTimes(2);
      expect(onMount).toHaveBeenCalledWith('index');
      expect(onMount).toHaveBeenCalledWith('stack-index');
    });
  });
});

it('when nesting NativeTabs, it throws an Error', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="nested" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      'nested/_layout': () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      'nested/index': () => <View testID="index-nested" />,
    })
  ).toThrow(
    'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
  );
});

describe('Native props validation', () => {
  let warn;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  it.each(SUPPORTED_BLUR_EFFECTS)('supports %s blur effect', (blurEffect) => {
    renderRouter({
      _layout: () => (
        <NativeTabs blurEffect={blurEffect}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsScreen).toHaveBeenCalledTimes(1);
    expect(TabsScreen.mock.calls[0][0].standardAppearance.tabBarBlurEffect).toBe(blurEffect);
    expect(TabsScreen.mock.calls[0][0].scrollEdgeAppearance.tabBarBlurEffect).toBe('none');
  });
  it.each(['test', 'wrongValue', ...SUPPORTED_BLUR_EFFECTS.map((x) => x.toUpperCase())])(
    'warns when unsupported %s blur effect is used',
    (blurEffect) => {
      renderRouter({
        _layout: () => (
          // @ts-expect-error
          <NativeTabs blurEffect={blurEffect}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        `Unsupported blurEffect: ${blurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`
      );
      expect(TabsScreen).toHaveBeenCalledTimes(1);
      expect(TabsScreen.mock.calls[0][0].standardAppearance.tabBarBlurEffect).toBe(undefined);
      expect(TabsScreen.mock.calls[0][0].scrollEdgeAppearance.tabBarBlurEffect).toBe('none');
    }
  );
  it.each(SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES)(
    'supports %s label visibility mode',
    (labelVisibilityMode) => {
      renderRouter({
        _layout: () => (
          <NativeTabs labelVisibilityMode={labelVisibilityMode}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsHost).toHaveBeenCalledTimes(1);
      expect(TabsHost.mock.calls[0][0].tabBarItemLabelVisibilityMode).toBe(labelVisibilityMode);
    }
  );
  it.each([
    'test',
    'wrongValue',
    ...SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((x) => x.toUpperCase()),
  ])('warns when unsupported %s label visibility mode is used', (labelVisibilityMode) => {
    renderRouter({
      _layout: () => (
        // @ts-expect-error
        <NativeTabs labelVisibilityMode={labelVisibilityMode}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((effect) => `"${effect}"`).join(', ')}`
    );
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].tabBarItemLabelVisibilityMode).toBe(undefined);
  });
  it.each(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS)(
    'supports %s minimize behavior',
    (minimizeBehavior) => {
      renderRouter({
        _layout: () => (
          <NativeTabs minimizeBehavior={minimizeBehavior}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(TabsHost).toHaveBeenCalledTimes(1);
      expect(TabsHost.mock.calls[0][0].tabBarMinimizeBehavior).toBe(minimizeBehavior);
    }
  );
  it.each([
    'test',
    'wrongValue',
    ...SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((x) => x.toUpperCase()),
  ])('warns when unsupported %s minimize behavior is used', (minimizeBehavior) => {
    renderRouter({
      _layout: () => (
        // @ts-expect-error
        <NativeTabs minimizeBehavior={minimizeBehavior}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `Unsupported minimizeBehavior: ${minimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((effect) => `"${effect}"`).join(', ')}`
    );
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].tabBarMinimizeBehavior).toBe(undefined);
  });
});

describe('Misc', () => {
  it('usePreventRemove can be used inside the stack nested in tabs', () => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="stack" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      'stack/_layout': () => {
        return <Stack />;
      },
      'stack/index': function InnerIndex() {
        usePreventRemove(true, () => {});
        return <View testID="stack-index" />;
      },
    });

    router.navigate('/stack');
    expect(screen.getByTestId('stack-index')).toBeVisible();
  });

  it('passes the bottom accessory to NativeTabsView', () => {
    const BottomAccessoryContent = jest.fn(() => <View testID="bottom-accessory" />);
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.BottomAccessory>
            <BottomAccessoryContent />
          </NativeTabs.BottomAccessory>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });
    expect(screen.getByTestId('index')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].bottomAccessory).toBeDefined();

    const bottomAccessoryFn = TabsHost.mock.calls[0][0].bottomAccessory!;
    const regularRender = bottomAccessoryFn('regular');
    const inlineRender = bottomAccessoryFn('inline');

    expect(isValidElement(regularRender)).toBe(true);
    // To satisfy TypeScript
    if (!isValidElement(regularRender)) throw new Error();
    expect(regularRender.type === BottomAccessoryPlacementContext).toBe(true);

    expect(isValidElement(inlineRender)).toBe(true);
    // To satisfy TypeScript
    if (!isValidElement(inlineRender)) throw new Error();
    expect(inlineRender.type === BottomAccessoryPlacementContext).toBe(true);
  });

  it.each([
    { hidden: true, expected: true },
    { hidden: false, expected: false },
    { hidden: undefined, expected: undefined },
  ])('passes hidden=$hidden prop to TabsHost', ({ hidden, expected }) => {
    renderRouter({
      _layout: () => (
        <NativeTabs hidden={hidden}>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="second" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByTestId('second')).toBeVisible();
    expect(TabsHost).toHaveBeenCalledTimes(1);
    expect(TabsHost.mock.calls[0][0].tabBarHidden).toBe(expected);
  });
});
