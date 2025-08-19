import { screen } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import {
  BottomTabsScreen as _BottomTabsScreen,
  BottomTabs as _BottomTabs,
} from 'react-native-screens';

import { usePathname } from '../../../hooks';
import { Redirect } from '../../../link/Redirect';
import { renderRouter } from '../../../testing-library';
import { NativeTabs } from '../NativeTabs';
import { NativeTabsView } from '../NativeTabsView';
import {
  SUPPORTED_BLUR_EFFECTS,
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
} from '../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    ...(jest.requireActual('react-native-screens') as typeof import('react-native-screens')),
    BottomTabs: jest.fn(({ children }) => <View testID="BottomTabs">{children}</View>),
    BottomTabsScreen: jest.fn(({ children }) => <View testID="BottomTabsScreen">{children}</View>),
  };
});

jest.mock('../NativeTabsView', () => {
  const originalModule = jest.requireActual('../NativeTabsView');
  return {
    ...originalModule,
    NativeTabsView: jest.fn((props) => <originalModule.NativeTabsView {...props} />),
  };
});

const BottomTabsScreen = _BottomTabsScreen as jest.MockedFunction<typeof _BottomTabsScreen>;
const BottomTabs = _BottomTabs as jest.MockedFunction<typeof _BottomTabs>;

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
  expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(3);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(1);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^index-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^second-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^index-[-\w]+/);
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
      expect((NativeTabsView as jest.Mock).mock.calls[0][0].builder.state).toMatchObject({
        type: 'tab',
        routeNames: ['first', 'second'],
        index: 0,
        routes: [
          expect.objectContaining({
            key: expect.any(String),
            name: 'first',
          }),
          expect.objectContaining({
            key: expect.any(String),
            name: 'second',
          }),
        ],
      });
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
    expect(BottomTabsScreen).not.toHaveBeenCalled();
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
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
    expect(BottomTabsScreen).toHaveBeenCalledTimes(2);
    expect(BottomTabsScreen.mock.calls[0][0].isFocused).toBe(false);
    expect(BottomTabsScreen.mock.calls[0][0].tabKey).toMatch(/^first-[-\w]+/);
    expect(BottomTabsScreen.mock.calls[1][0].isFocused).toBe(true);
    expect(BottomTabsScreen.mock.calls[1][0].tabKey).toMatch(/^second-[-\w]+/);
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
    expect(BottomTabsScreen).not.toHaveBeenCalled();
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
  it.each(SUPPORTED_BLUR_EFFECTS)('supports %s blur effect', (blurEffect) => {
    renderRouter({
      _layout: () => (
        <NativeTabs style={{ blurEffect }}>
          <NativeTabs.Trigger name="index" />
        </NativeTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(BottomTabs).toHaveBeenCalledTimes(1);
    expect(BottomTabs.mock.calls[0][0].tabBarBlurEffect).toBe(blurEffect);
  });
  it.each(['test', 'wrongValue', ...SUPPORTED_BLUR_EFFECTS.map((x) => x.toUpperCase())])(
    'throws error for unsupported %s blur effect',
    (blurEffect) => {
      expect(() =>
        renderRouter({
          _layout: () => (
            // @ts-expect-error
            <NativeTabs style={{ blurEffect }}>
              <NativeTabs.Trigger name="index" />
            </NativeTabs>
          ),
          index: () => <View testID="index" />,
        })
      ).toThrow(
        `Unsupported blurEffect: ${blurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`
      );
    }
  );
  it.each(SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES)(
    'supports %s label visibility mode',
    (labelVisibilityMode) => {
      renderRouter({
        _layout: () => (
          <NativeTabs style={{ labelVisibilityMode }}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      });

      expect(screen.getByTestId('index')).toBeVisible();
      expect(BottomTabs).toHaveBeenCalledTimes(1);
      expect(BottomTabs.mock.calls[0][0].tabBarItemLabelVisibilityMode).toBe(labelVisibilityMode);
    }
  );
  it.each([
    'test',
    'wrongValue',
    ...SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((x) => x.toUpperCase()),
  ])('throws error for unsupported %s label visibility mode', (labelVisibilityMode) => {
    expect(() =>
      renderRouter({
        _layout: () => (
          // @ts-expect-error
          <NativeTabs style={{ labelVisibilityMode }}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      })
    ).toThrow(
      `Unsupported labelVisibilityMode: ${labelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((effect) => `"${effect}"`).join(', ')}`
    );
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
      expect(BottomTabs).toHaveBeenCalledTimes(1);
      expect(BottomTabs.mock.calls[0][0].tabBarMinimizeBehavior).toBe(minimizeBehavior);
    }
  );
  it.each([
    'test',
    'wrongValue',
    ...SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((x) => x.toUpperCase()),
  ])('throws error for unsupported %s minimize behavior', (minimizeBehavior) => {
    expect(() =>
      renderRouter({
        _layout: () => (
          // @ts-expect-error
          <NativeTabs minimizeBehavior={minimizeBehavior}>
            <NativeTabs.Trigger name="index" />
          </NativeTabs>
        ),
        index: () => <View testID="index" />,
      })
    ).toThrow(
      `Unsupported minimizeBehavior: ${minimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((effect) => `"${effect}"`).join(', ')}`
    );
  });
});
