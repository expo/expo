import { render, renderHook, within } from '@testing-library/react-native';
import { Platform, View } from 'react-native';

import type { NativeStackHeaderItem } from '../types';
import {
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  defaultProps,
  getMocks,
} from './useHeaderConfigProps-setup';
import { useHeaderConfigProps } from '../views/useHeaderConfigProps';

jest.mock('react-native-screens', () => {
  const MockedReact = require('react');
  const RN = require('react-native');
  const mockComp = (testID: string) =>
    jest.fn(({ children, ...props }: any) =>
      MockedReact.createElement(RN.View, { testID, ...props }, children)
    );
  return {
    isSearchBarAvailableForCurrentPlatform: true,
    ScreenStackHeaderBackButtonImage: mockComp('ScreenStackHeaderBackButtonImage'),
    ScreenStackHeaderCenterView: mockComp('ScreenStackHeaderCenterView'),
    ScreenStackHeaderLeftView: mockComp('ScreenStackHeaderLeftView'),
    ScreenStackHeaderRightView: mockComp('ScreenStackHeaderRightView'),
    ScreenStackHeaderSearchBarView: mockComp('ScreenStackHeaderSearchBarView'),
    SearchBar: mockComp('SearchBar'),
  };
});

jest.mock('../../native', () => ({
  useLocale: jest.fn(),
  useTheme: jest.fn(),
}));

jest.mock('../views/FontProcessor', () => ({
  processFonts: jest.fn((families: (string | undefined)[]) => families),
}));

jest.mock('../../elements', () => {
  const MockedReact = require('react');
  const RN = require('react-native');
  return {
    getHeaderTitle: (
      options: { title?: string; headerTitle?: string | ((...args: any[]) => any) },
      fallback: string
    ) =>
      typeof options.headerTitle === 'string'
        ? options.headerTitle
        : options.title !== undefined
          ? options.title
          : fallback,
    HeaderTitle: jest.fn(({ children, ...props }: any) =>
      MockedReact.createElement(RN.Text, props, children)
    ),
  };
});

const { MockedScreenStackHeaderBackButtonImage, mockedUseLocale, mockedUseTheme } = getMocks();

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  mockedUseLocale.mockReturnValue({ direction: 'ltr' });
  mockedUseTheme.mockReturnValue({
    dark: false,
    colors: DEFAULT_COLORS,
    fonts: DEFAULT_FONTS,
  } as any);
});

// ─── tintColor ──────────────────────────────────────────────────────────────────

describe('tintColor', () => {
  test('defaults to colors.primary on iOS', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.color).toBe(DEFAULT_COLORS.primary);
  });

  test('custom headerTintColor overrides default', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTintColor: 'red' }))
    );
    expect(result.current.color).toBe('red');
  });
});

// ─── title ──────────────────────────────────────────────────────────────────────

describe('title', () => {
  test('uses route.name as fallback', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ route: { name: 'XYZ' } }))
    );
    expect(result.current.title).toBe('XYZ');
  });

  test('title prop overrides route.name', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ title: 'Custom Title' }))
    );
    expect(result.current.title).toBe('Custom Title');
  });

  test('headerTitle string overrides title prop', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ title: 'Title', headerTitle: 'Header Title' }))
    );
    expect(result.current.title).toBe('Header Title');
  });

  test('headerTitle function does not override title text', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ title: 'Title', headerTitle: () => <View /> }))
    );
    expect(result.current.title).toBe('Title');
  });
});

// ─── titleColor ─────────────────────────────────────────────────────────────────

describe('titleColor', () => {
  test('defaults to colors.text when no headerTitleStyle.color or headerTintColor', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.titleColor).toBe(DEFAULT_COLORS.text);
  });

  test('uses headerTintColor when no headerTitleStyle.color', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTintColor: 'purple' }))
    );
    expect(result.current.titleColor).toBe('purple');
  });

  test('headerTitleStyle.color overrides headerTintColor', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({ headerTintColor: 'purple', headerTitleStyle: { color: 'orange' } })
      )
    );
    expect(result.current.titleColor).toBe('orange');
  });
});

// ─── backgroundColor ────────────────────────────────────────────────────────────

describe('backgroundColor', () => {
  test('defaults to colors.card', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.backgroundColor).toBe(DEFAULT_COLORS.card);
  });

  test('headerStyle.backgroundColor overrides all', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerStyle: { backgroundColor: 'pink' },
          headerBackground: () => <View />,
          headerTransparent: true,
        })
      )
    );
    expect(result.current.backgroundColor).toBe('pink');
  });

  test('transparent when headerBackground is set', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackground: () => <View /> }))
    );
    expect(result.current.backgroundColor).toBe('transparent');
  });

  test('transparent when headerTransparent is true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTransparent: true }))
    );
    expect(result.current.backgroundColor).toBe('transparent');
  });

  test('transparent when headerLargeTitleEnabled on iOS', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleEnabled: true }))
    );
    expect(result.current.backgroundColor).toBe('transparent');
  });
});

// ─── hidden and visibility ──────────────────────────────────────────────────────

describe('hidden and visibility', () => {
  test('hidden is true when headerShown is false', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps({ headerShown: false })));
    expect(result.current.hidden).toBe(true);
  });

  test('hidden is falsy when headerShown is true', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps({ headerShown: true })));
    expect(result.current.hidden).toBeFalsy();
  });

  test('hideBackButton is true when headerBackVisible is false', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackVisible: false }))
    );
    expect(result.current.hideBackButton).toBe(true);
  });

  test('hideBackButton is falsy when headerBackVisible is not false', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.hideBackButton).toBeFalsy();
  });
});

// ─── headerLeft/headerRight callbacks ───────────────────────────────────────────

describe('headerLeft/headerRight callbacks', () => {
  test('headerLeft receives canGoBack=true when headerBack is set', () => {
    const headerLeft = jest.fn(() => null);
    renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerBack: { title: 'Back', href: undefined },
          headerLeft: headerLeft as any,
        })
      )
    );
    expect(headerLeft).toHaveBeenCalledWith(
      expect.objectContaining({ canGoBack: true, label: 'Back', tintColor: DEFAULT_COLORS.primary })
    );
  });

  test('headerLeft receives canGoBack=false when headerBack is undefined', () => {
    const headerLeft = jest.fn(() => null);
    renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBack: undefined, headerLeft: headerLeft as any }))
    );
    expect(headerLeft).toHaveBeenCalledWith(
      expect.objectContaining({ canGoBack: false, tintColor: DEFAULT_COLORS.primary })
    );
  });

  test('headerRight receives tintColor and canGoBack', () => {
    const headerRight = jest.fn(() => null);
    renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerBack: { title: 'Back', href: undefined },
          headerRight: headerRight as any,
        })
      )
    );
    expect(headerRight).toHaveBeenCalledWith(
      expect.objectContaining({
        tintColor: DEFAULT_COLORS.primary,
        canGoBack: true,
      })
    );
  });

  test('headerLeft label uses headerBackTitle over headerBack.title', () => {
    const headerLeft = jest.fn(() => null);
    renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerBack: { title: 'Back', href: undefined },
          headerBackTitle: 'Custom Back',
          headerLeft: headerLeft as any,
        })
      )
    );
    expect(headerLeft).toHaveBeenCalledWith(expect.objectContaining({ label: 'Custom Back' }));
  });
});

// ─── hideShadow ─────────────────────────────────────────────────────────────────

describe('hideShadow', () => {
  test('true when headerShadowVisible is false', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerShadowVisible: false }))
    );
    expect(result.current.hideShadow).toBe(true);
  });

  test.each([false, true])(
    'true when headerBackground is set and headerShadowVisible is %s',
    (headerShadowVisible) => {
      const { result } = renderHook(() =>
        useHeaderConfigProps(
          defaultProps({ headerBackground: () => <View />, headerShadowVisible })
        )
      );
      expect(result.current.hideShadow).toBe(true);
    }
  );

  test('true when headerTransparent is true and headerShadowVisible is not true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTransparent: true }))
    );
    expect(result.current.hideShadow).toBe(true);
  });

  test('false when headerTransparent is true but headerShadowVisible is true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTransparent: true, headerShadowVisible: true }))
    );
    expect(result.current.hideShadow).toBe(false);
  });

  test('false by default', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.hideShadow).toBeFalsy();
  });
});

// ─── translucent ────────────────────────────────────────────────────────────────

describe('translucent', () => {
  test('true when headerBackground is set', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackground: () => <View /> }))
    );
    expect(result.current.translucent).toBe(true);
  });

  test('true when headerTransparent is true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTransparent: true }))
    );
    expect(result.current.translucent).toBe(true);
  });

  test.each([
    { headerTransparent: undefined, expected: true },
    { headerTransparent: true, expected: true },
    { headerTransparent: false, expected: false },
  ])(
    'with large title enabled and headerTransparent=$headerTransparent, translucent is $expected',
    ({ headerTransparent, expected }) => {
      const { result } = renderHook(() =>
        useHeaderConfigProps(defaultProps({ headerLargeTitleEnabled: true, headerTransparent }))
      );
      expect(result.current.translucent).toBe(expected);
    }
  );

  test.each([
    { headerTransparent: undefined, expected: true },
    { headerTransparent: true, expected: true },
    { headerTransparent: false, expected: false },
  ])(
    'with search bar and headerTransparent=$headerTransparent, translucent is $expected',
    ({ headerTransparent, expected }) => {
      const { result } = renderHook(() =>
        useHeaderConfigProps(defaultProps({ headerSearchBarOptions: {}, headerTransparent }))
      );
      expect(result.current.translucent).toBe(expected);
    }
  );

  test('false by default', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.translucent).toBe(false);
  });
});

// ─── backButtonDisplayMode ──────────────────────────────────────────────────────

describe('backButtonDisplayMode', () => {
  beforeEach(() => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('14');
  });

  test('uses headerBackButtonDisplayMode on iOS 14+', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonDisplayMode: 'minimal' }))
    );
    expect(result.current.backButtonDisplayMode).toBe('minimal');
    expect(result.current.backTitleVisible).toBeUndefined();
  });

  // TODO(@ubax): Remove fallback since we only support iOS 16+
  test('falls back to backTitleVisible on iOS < 14', () => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('13');
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonDisplayMode: 'minimal' }))
    );
    expect(result.current.backButtonDisplayMode).toBeUndefined();
    expect(result.current.backTitleVisible).toBe(false);
  });

  test('falls back when custom backTitleFontFamily is set', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackTitleStyle: { fontFamily: 'CustomFont' } }))
    );
    expect(result.current.backButtonDisplayMode).toBeUndefined();
  });

  test('falls back when custom backTitleFontSize is set', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackTitleStyle: { fontSize: 18 } }))
    );
    expect(result.current.backButtonDisplayMode).toBeUndefined();
  });

  test('falls back when headerBackButtonMenuEnabled is false', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonMenuEnabled: false }))
    );
    expect(result.current.backButtonDisplayMode).toBeUndefined();
  });

  test('backTitleVisible is true when headerBackButtonDisplayMode is default on iOS < 14', () => {
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('13');
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonDisplayMode: 'default' }))
    );
    expect(result.current.backTitleVisible).toBe(true);
  });
});

// ─── backButtonInCustomView ─────────────────────────────────────────────────────

describe('backButtonInCustomView', () => {
  test('true when headerBackVisible is true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackVisible: true }))
    );
    expect(result.current.backButtonInCustomView).toBe(true);
  });

  test('false on iOS when headerTitle is a function and no headerLeft', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitle: () => <View /> }))
    );
    expect(result.current.backButtonInCustomView).toBeFalsy();
  });
});

// ─── disableBackButtonMenu ──────────────────────────────────────────────────────

describe('disableBackButtonMenu', () => {
  test('true when headerBackButtonMenuEnabled is false', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackButtonMenuEnabled: false }))
    );
    expect(result.current.disableBackButtonMenu).toBe(true);
  });

  test('false by default', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.disableBackButtonMenu).toBe(false);
  });
});

// ─── direction ──────────────────────────────────────────────────────────────────

describe('direction', () => {
  test.each(['rtl', 'ltr'] as const)('uses direction from useLocale %s', (direction) => {
    mockedUseLocale.mockReturnValue({ direction });
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.direction).toBe(direction);
  });
});

// ─── experimental_userInterfaceStyle ────────────────────────────────────────────

describe('experimental_userInterfaceStyle', () => {
  test('returns dark when theme is dark', () => {
    mockedUseTheme.mockReturnValue({
      dark: true,
      colors: DEFAULT_COLORS,
      fonts: DEFAULT_FONTS,
    } as any);
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.experimental_userInterfaceStyle).toBe('dark');
  });

  test('returns light when theme is not dark', () => {
    mockedUseTheme.mockReturnValue({
      dark: false,
      colors: DEFAULT_COLORS,
      fonts: DEFAULT_FONTS,
    } as any);
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.experimental_userInterfaceStyle).toBe('light');
  });
});

// ─── largeTitleHideShadow ───────────────────────────────────────────────────────

describe('largeTitleHideShadow', () => {
  test('true when headerLargeTitleShadowVisible is false', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleShadowVisible: false }))
    );
    expect(result.current.largeTitleHideShadow).toBe(true);
  });

  test('falsy when headerLargeTitleShadowVisible is not false', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.largeTitleHideShadow).toBeFalsy();
  });
});

// ─── font properties ────────────────────────────────────────────────────────────

describe('font properties', () => {
  test('titleFontSize from headerTitleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitleStyle: { fontSize: 20 } }))
    );
    expect(result.current.titleFontSize).toBe(20);
  });

  test('titleFontWeight from headerTitleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitleStyle: { fontWeight: 'bold' } }))
    );
    expect(result.current.titleFontWeight).toBe('bold');
  });

  test('largeTitleFontSize from headerLargeTitleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleStyle: { fontSize: 34 } }))
    );
    expect(result.current.largeTitleFontSize).toBe(34);
  });

  test('largeTitleColor from headerLargeTitleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitleStyle: { color: 'red' } }))
    );
    expect(result.current.largeTitleColor).toBe('red');
  });

  test('largeTitleBackgroundColor from headerLargeStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeStyle: { backgroundColor: 'blue' } }))
    );
    expect(result.current.largeTitleBackgroundColor).toBe('blue');
  });

  test('backTitleFontSize from headerBackTitleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackTitleStyle: { fontSize: 14 } }))
    );
    expect(result.current.backTitleFontSize).toBe(14);
  });

  test('backTitleFontSize is undefined when not set', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    expect(result.current.backTitleFontSize).toBeUndefined();
  });
});

// ─── blurEffect ─────────────────────────────────────────────────────────────────

describe('blurEffect', () => {
  test.each(['dark', 'light', 'systemChromeMaterial'] as const)(
    'passes through headerBlurEffect %s',
    (blurEffect) => {
      const { result } = renderHook(() =>
        useHeaderConfigProps(defaultProps({ headerBlurEffect: blurEffect }))
      );
      expect(result.current.blurEffect).toBe(blurEffect);
    }
  );
});

// ─── deprecated headerLargeTitle ────────────────────────────────────────────────

describe('deprecated headerLargeTitle', () => {
  test('headerLargeTitle is used as fallback for headerLargeTitleEnabled', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitle: true }))
    );
    expect(result.current.largeTitle).toBe(true);
  });

  test('headerLargeTitleEnabled overrides headerLargeTitle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLargeTitle: true, headerLargeTitleEnabled: false }))
    );
    expect(result.current.largeTitle).toBe(false);
  });
});

// ─── processBarButtonItems ──────────────────────────────────────────────────────
// TODO(@ubax): Consider refactoring processBarButtonItems to be a separate function that can be tested in isolation instead of testing it indirectly via headerLeft items
describe('processBarButtonItems', () => {
  test('custom type items are filtered out', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'custom', element: <View /> }] as NativeStackHeaderItem[],
        })
      )
    );
    expect(result.current.headerLeftBarButtonItems).toEqual([]);
  });

  test('spacing type passes through', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'spacing', spacing: 10 }] as NativeStackHeaderItem[],
        })
      )
    );
    expect(result.current.headerLeftBarButtonItems).toEqual([{ type: 'spacing', spacing: 10 }]);
  });

  test('spacing type throws when spacing prop is missing', () => {
    expect(() => {
      renderHook(() =>
        useHeaderConfigProps(
          defaultProps({
            unstable_headerLeftItems: () =>
              [{ type: 'spacing' }] as unknown as NativeStackHeaderItem[],
          })
        )
      );
    }).toThrow("Spacing item must have a 'spacing' property");
  });

  test('button type transforms label to title and adds index', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'button', label: 'Edit', onPress }] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0];
    expect(item).toEqual(
      expect.objectContaining({
        type: 'button',
        title: 'Edit',
        index: 0,
        onPress,
      })
    );
    expect((item as any).label).toBeUndefined();
  });

  test('button icon: image type with tinted (default) transforms to templateSource', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                icon: { type: 'image', source: { uri: 'icon.png' } },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.icon).toEqual({ type: 'templateSource', templateSource: { uri: 'icon.png' } });
  });

  test('button icon: image type with tinted=false transforms to imageSource', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                icon: { type: 'image', source: { uri: 'icon.png' }, tinted: false },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.icon).toEqual({ type: 'imageSource', imageSource: { uri: 'icon.png' } });
  });

  test('button icon: non-image type passes through', () => {
    const icon = { type: 'sfSymbol' as const, name: 'star' };
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'button', label: 'Btn', icon, onPress: jest.fn() }] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.icon).toEqual(icon);
  });

  test('menu type transforms menu properties', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Sort',
                onPress,
                menu: {
                  multiselectable: true,
                  layout: 'palette',
                  items: [{ type: 'action', label: 'Delete', onPress: jest.fn() }],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.menu.singleSelection).toBe(false);
    expect(item.menu.displayAsPalette).toBe(true);
    expect(item.menu.items[0].title).toBe('Delete');
  });

  test('menu type throws when menu prop is missing', () => {
    expect(() => {
      renderHook(() =>
        useHeaderConfigProps(
          defaultProps({
            unstable_headerLeftItems: () =>
              [{ type: 'menu', label: 'Menu' }] as unknown as NativeStackHeaderItem[],
          })
        )
      );
    }).toThrow("Menu item must have a 'menu' property");
  });

  test('invalid type throws', () => {
    expect(() => {
      renderHook(() =>
        useHeaderConfigProps(
          defaultProps({
            unstable_headerLeftItems: () =>
              [{ type: 'invalid' }] as unknown as NativeStackHeaderItem[],
          })
        )
      );
    }).toThrow('Invalid item type');
  });

  test('badge value is stringified', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              { type: 'button', label: 'Btn', badge: { value: 5 }, onPress: jest.fn() },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.badge.value).toBe('5');
  });

  test('badge backgroundColor defaults to colors.notification', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              { type: 'button', label: 'Btn', badge: { value: 1 }, onPress: jest.fn() },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.badge.style.backgroundColor).toBe(DEFAULT_COLORS.notification);
  });

  test('badge backgroundColor uses badge.style.backgroundColor when provided', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                badge: { value: 1, style: { backgroundColor: 'yellow' } },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.badge.style.backgroundColor).toBe('yellow');
  });

  test('badge text color is black for light backgrounds', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                badge: { value: 1, style: { backgroundColor: 'white' } },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.badge.style.color).toBe('black');
  });

  test('badge text color is white for dark backgrounds', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                badge: { value: 1, style: { backgroundColor: 'black' } },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.badge.style.color).toBe('white');
  });

  test('multiselectable undefined produces singleSelection true', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Menu',
                onPress: jest.fn(),
                menu: {
                  items: [{ type: 'action', label: 'A', onPress: jest.fn() }],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.menu.singleSelection).toBe(true);
  });

  test('labelStyle is merged onto titleStyle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'button',
                label: 'Btn',
                labelStyle: { color: 'red', fontSize: 16 },
                onPress: jest.fn(),
              },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const item = result.current.headerLeftBarButtonItems![0] as any;
    expect(item.titleStyle.color).toBe('red');
    expect(item.titleStyle.fontSize).toBe(16);
  });
});

// ─── getMenuItem (via menu items) ───────────────────────────────────────────────
// TODO(@ubax): Consider refactoring getMenuItem to be a separate function that can be tested in isolation instead of testing it indirectly via headerLeft items
describe('getMenuItem', () => {
  test('action item: label becomes title, description becomes subtitle', () => {
    const onPress = jest.fn();
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Menu',
                onPress: jest.fn(),
                menu: {
                  items: [
                    { type: 'action', label: 'Copy', description: 'Copy to clipboard', onPress },
                  ],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const menuItem = (result.current.headerLeftBarButtonItems![0] as any).menu.items[0];
    expect(menuItem.title).toBe('Copy');
    expect(menuItem.subtitle).toBe('Copy to clipboard');
    expect(menuItem.label).toBeUndefined();
    expect(menuItem.description).toBeUndefined();
  });

  test('submenu transforms label, inline, multiselectable, layout', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Menu',
                onPress: jest.fn(),
                menu: {
                  items: [
                    {
                      type: 'submenu',
                      label: 'Sort',
                      inline: true,
                      multiselectable: true,
                      layout: 'palette',
                      items: [{ type: 'action', label: 'A', onPress: jest.fn() }],
                    },
                  ],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const submenu = (result.current.headerLeftBarButtonItems![0] as any).menu.items[0];
    expect(submenu.title).toBe('Sort');
    expect(submenu.displayInline).toBe(true);
    expect(submenu.singleSelection).toBe(false);
    expect(submenu.displayAsPalette).toBe(true);
  });

  test('submenu recursively processes nested items', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Menu',
                onPress: jest.fn(),
                menu: {
                  items: [
                    {
                      type: 'submenu',
                      label: 'Outer',
                      items: [
                        {
                          type: 'submenu',
                          label: 'Inner',
                          items: [{ type: 'action', label: 'Leaf', onPress: jest.fn() }],
                        },
                      ],
                    },
                  ],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const outerSubmenu = (result.current.headerLeftBarButtonItems![0] as any).menu.items[0];
    expect(outerSubmenu.title).toBe('Outer');
    const innerSubmenu = outerSubmenu.items[0];
    expect(innerSubmenu.title).toBe('Inner');
    const leaf = innerSubmenu.items[0];
    expect(leaf.title).toBe('Leaf');
  });

  test('submenu icon is transformed via transformIcon', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [
              {
                type: 'menu',
                label: 'Menu',
                onPress: jest.fn(),
                menu: {
                  items: [
                    {
                      type: 'submenu',
                      label: 'Sub',
                      icon: { type: 'image', source: { uri: 'x.png' } },
                      items: [{ type: 'action', label: 'A', onPress: jest.fn() }],
                    },
                  ],
                },
              },
            ] as unknown as NativeStackHeaderItem[],
        })
      )
    );
    const submenu = (result.current.headerLeftBarButtonItems![0] as any).menu.items[0];
    expect(submenu.icon).toEqual({ type: 'templateSource', templateSource: { uri: 'x.png' } });
  });
});

// ─── rightItems ─────────────────────────────────────────────────────────────────

describe('rightItems', () => {
  test('reversed in headerRightBarButtonItems', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerRightItems: () =>
            [
              { type: 'button', label: 'First', onPress: jest.fn() },
              { type: 'button', label: 'Second', onPress: jest.fn() },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const items = result.current.headerRightBarButtonItems!;
    expect((items[0] as any).title).toBe('Second');
    expect((items[1] as any).title).toBe('First');
  });

  test('original array is not mutated by reversal', () => {
    const items: NativeStackHeaderItem[] = [
      { type: 'button', label: 'First', onPress: jest.fn() } as NativeStackHeaderItem,
      { type: 'button', label: 'Second', onPress: jest.fn() } as NativeStackHeaderItem,
    ];
    const itemsCopy = [...items];
    renderHook(() =>
      useHeaderConfigProps(defaultProps({ unstable_headerRightItems: () => items }))
    );
    expect(items[0]).toBe(itemsCopy[0]);
    expect(items[1]).toBe(itemsCopy[1]);
  });
});

// ─── children rendering (iOS) ───────────────────────────────────────────────────

describe('children rendering', () => {
  test('leftItems custom items render in ScreenStackHeaderLeftView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'custom', element: <View testID="left-custom" /> }] as NativeStackHeaderItem[],
        })
      )
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const leftView = getByTestId('ScreenStackHeaderLeftView');
    expect(within(leftView).getByTestId('left-custom')).toBeTruthy();
  });

  test('falls back to headerLeftElement when no leftItems', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerLeft: () => <View testID="header-left" /> }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const leftView = getByTestId('ScreenStackHeaderLeftView');
    expect(within(leftView).getByTestId('header-left')).toBeTruthy();
  });

  test('headerTitle function renders in ScreenStackHeaderCenterView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitle: () => <View testID="custom-title" /> }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const centerView = getByTestId('ScreenStackHeaderCenterView');
    expect(within(centerView).getByTestId('custom-title')).toBeTruthy();
  });

  test('rightItems custom items render in ScreenStackHeaderRightView', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerRightItems: () =>
            [
              { type: 'custom', element: <View testID="right-custom" /> },
            ] as NativeStackHeaderItem[],
        })
      )
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const rightView = getByTestId('ScreenStackHeaderRightView');
    expect(within(rightView).getByTestId('right-custom')).toBeTruthy();
  });

  test('non-custom leftItems render nothing in children', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          unstable_headerLeftItems: () =>
            [{ type: 'button', label: 'Btn', onPress: jest.fn() }] as NativeStackHeaderItem[],
        })
      )
    );
    const { queryByTestId } = render(<View>{result.current.children}</View>);
    expect(queryByTestId('ScreenStackHeaderLeftView')).toBeNull();
  });

  test('search bar rendered when options provided', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerSearchBarOptions: { placeholder: 'Search' } }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    const searchBarView = getByTestId('ScreenStackHeaderSearchBarView');
    expect(within(searchBarView).getByTestId('SearchBar')).toBeTruthy();
  });

  test('search bar not rendered when options not provided', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    const { queryByTestId } = render(<View>{result.current.children}</View>);
    expect(queryByTestId('ScreenStackHeaderSearchBarView')).toBeNull();
  });

  test('headerBackIcon renders ScreenStackHeaderBackButtonImage', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackIcon: { source: { uri: 'back.png' } } as any }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    expect(getByTestId('ScreenStackHeaderBackButtonImage')).toBeTruthy();
    expect(MockedScreenStackHeaderBackButtonImage.mock.calls[0]![0].source).toEqual({
      uri: 'back.png',
    });
  });

  test('headerBackImageSource renders ScreenStackHeaderBackButtonImage', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackImageSource: { uri: 'back2.png' } as any }))
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    expect(getByTestId('ScreenStackHeaderBackButtonImage')).toBeTruthy();
    expect(MockedScreenStackHeaderBackButtonImage.mock.calls[0]![0].source).toEqual({
      uri: 'back2.png',
    });
  });

  test('headerBackIcon.source takes precedence over headerBackImageSource', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(
        defaultProps({
          headerBackIcon: { source: { uri: 'icon.png' } } as any,
          headerBackImageSource: { uri: 'image.png' } as any,
        })
      )
    );
    const { getByTestId } = render(<>{result.current.children}</>);
    expect(getByTestId('ScreenStackHeaderBackButtonImage')).toBeTruthy();
    expect(MockedScreenStackHeaderBackButtonImage.mock.calls[0]![0].source).toEqual({
      uri: 'icon.png',
    });
  });
});

// ─── titleFontWeight stringification ────────────────────────────────────────────

describe('titleFontWeight stringification', () => {
  test('titleFontWeight is stringified', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTitleStyle: { fontWeight: '700' } }))
    );
    expect(result.current.titleFontWeight).toBe('700');
  });

  test('titleFontWeight defaults to theme font weight (stringified)', () => {
    const { result } = renderHook(() => useHeaderConfigProps(defaultProps()));
    // On iOS, default title font is 'bold' with fontWeight from DEFAULT_FONTS
    expect(result.current.titleFontWeight).toBe(DEFAULT_FONTS.bold.fontWeight);
  });
});

// ─── topInsetEnabled ────────────────────────────────────────────────────────────

describe('topInsetEnabled', () => {
  test('passes through headerTopInsetEnabled', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerTopInsetEnabled: false }))
    );
    expect(result.current.topInsetEnabled).toBe(false);
  });
});

// ─── backTitle ──────────────────────────────────────────────────────────────────

describe('backTitle', () => {
  test('passes through headerBackTitle', () => {
    const { result } = renderHook(() =>
      useHeaderConfigProps(defaultProps({ headerBackTitle: 'Go Back' }))
    );
    expect(result.current.backTitle).toBe('Go Back');
  });
});
