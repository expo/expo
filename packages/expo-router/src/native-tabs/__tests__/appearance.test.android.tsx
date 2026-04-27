import type {
  TabsScreenAppearanceAndroid,
  TabsScreenItemStateAppearanceAndroid,
} from 'react-native-screens';

import type { ColorType } from '../../color';
import { createAndroidScreenAppearance } from '../appearance';
import type {
  NativeTabOptions,
  NativeTabsLabelStyle,
  NativeTabsTabBarItemLabelVisibilityMode,
} from '../types';

jest.mock('../../color', (): typeof import('../../color') => ({
  Color: {
    android: {
      dynamic: {
        onSurfaceVariant: 'mock-onSurfaceVariant',
        onSurface: 'mock-onSurface',
        onSecondaryContainer: 'mock-onSecondaryContainer',
        surfaceContainer: 'mock-surfaceContainer',
        primary: 'mock-primary',
        secondaryContainer: 'mock-secondaryContainer',
      } as ColorType['android']['dynamic'],
    } as ColorType['android'],
  } as ColorType,
}));

describe(createAndroidScreenAppearance, () => {
  it('uses dynamic color defaults when options and extras are empty', () => {
    const result = createAndroidScreenAppearance({
      options: {},
      tintColor: undefined,
      rippleColor: undefined,
      disableIndicator: undefined,
      labelVisibilityMode: undefined,
    });

    const expected: TabsScreenAppearanceAndroid = {
      tabBarBackgroundColor: 'mock-surfaceContainer',
      tabBarItemRippleColor: 'mock-primary',
      tabBarItemLabelVisibilityMode: undefined,
      tabBarItemActiveIndicatorColor: 'mock-secondaryContainer',
      tabBarItemActiveIndicatorEnabled: true,
      tabBarItemTitleFontFamily: undefined,
      tabBarItemTitleSmallLabelFontSize: undefined,
      tabBarItemTitleLargeLabelFontSize: undefined,
      tabBarItemTitleFontWeight: undefined,
      tabBarItemTitleFontStyle: undefined,
      tabBarItemBadgeBackgroundColor: undefined,
      tabBarItemBadgeTextColor: undefined,
      normal: {
        tabBarItemTitleFontColor: 'mock-onSurfaceVariant',
        tabBarItemIconColor: 'mock-onSurfaceVariant',
      },
      selected: {
        tabBarItemTitleFontColor: 'mock-onSurface',
        tabBarItemIconColor: 'mock-onSecondaryContainer',
      },
    };
    expect(result).toEqual(expected);
  });

  it('overrides every default when all options are provided', () => {
    const labelStyle: NativeTabsLabelStyle = {
      fontFamily: 'Roboto',
      fontSize: 12,
      fontStyle: 'italic',
      fontWeight: '500',
      color: '#111',
    };
    const selectedLabelStyle: NativeTabsLabelStyle = {
      fontFamily: 'Roboto-Bold',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#222',
    };
    const options: NativeTabOptions = {
      backgroundColor: '#bg',
      iconColor: '#icon',
      selectedIconColor: '#selectedIcon',
      badgeBackgroundColor: '#badgeBg',
      badgeTextColor: '#badgeText',
      indicatorColor: '#indicator',
      labelStyle,
      selectedLabelStyle,
    };

    const result = createAndroidScreenAppearance({
      options,
      tintColor: '#tint',
      rippleColor: '#ripple',
      disableIndicator: false,
      labelVisibilityMode: 'labeled',
    });

    const expected: TabsScreenAppearanceAndroid = {
      tabBarBackgroundColor: '#bg',
      tabBarItemRippleColor: '#ripple',
      tabBarItemLabelVisibilityMode: 'labeled',
      tabBarItemActiveIndicatorColor: '#indicator',
      tabBarItemActiveIndicatorEnabled: true,
      tabBarItemTitleFontFamily: 'Roboto',
      tabBarItemTitleSmallLabelFontSize: 12,
      tabBarItemTitleLargeLabelFontSize: 16,
      tabBarItemTitleFontWeight: '500',
      tabBarItemTitleFontStyle: 'italic',
      tabBarItemBadgeBackgroundColor: '#badgeBg',
      tabBarItemBadgeTextColor: '#badgeText',
      normal: {
        tabBarItemTitleFontColor: '#111',
        tabBarItemIconColor: '#icon',
      },
      selected: {
        tabBarItemTitleFontColor: '#222',
        tabBarItemIconColor: '#selectedIcon',
      },
    };
    expect(result).toEqual(expected);
  });

  describe('selected.tabBarItemTitleFontColor fallback chain', () => {
    type FontColorCase = {
      name: string;
      labelStyle?: NativeTabsLabelStyle;
      selectedLabelStyle?: NativeTabsLabelStyle;
      tintColor?: string;
      expected: TabsScreenItemStateAppearanceAndroid['tabBarItemTitleFontColor'];
    };
    const cases: FontColorCase[] = [
      {
        name: 'selectedLabelStyle.color wins over labelStyle.color and tintColor',
        labelStyle: { color: '#labelColor' },
        selectedLabelStyle: { color: '#selectedColor' },
        tintColor: '#tint',
        expected: '#selectedColor',
      },
      {
        name: 'falls back to labelStyle.color when selectedLabelStyle.color is missing',
        labelStyle: { color: '#labelColor' },
        tintColor: '#tint',
        expected: '#labelColor',
      },
      {
        name: 'falls back to tintColor when no label colors provided',
        tintColor: '#tint',
        expected: '#tint',
      },
      {
        name: 'falls back to dynamic onSurface when nothing is provided',
        expected: 'mock-onSurface',
      },
    ];

    it.each(cases)('$name', ({ labelStyle, selectedLabelStyle, tintColor, expected }) => {
      const result = createAndroidScreenAppearance({
        options: { labelStyle, selectedLabelStyle },
        tintColor,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.selected?.tabBarItemTitleFontColor).toBe(expected);
    });
  });

  describe('selected.tabBarItemIconColor fallback chain', () => {
    type IconColorCase = {
      name: string;
      iconColor?: string;
      selectedIconColor?: string;
      tintColor?: string;
      expected: TabsScreenItemStateAppearanceAndroid['tabBarItemIconColor'];
    };
    const cases: IconColorCase[] = [
      {
        name: 'selectedIconColor wins over iconColor and tintColor',
        iconColor: '#icon',
        selectedIconColor: '#selectedIcon',
        tintColor: '#tint',
        expected: '#selectedIcon',
      },
      {
        name: 'falls back to iconColor when selectedIconColor is missing',
        iconColor: '#icon',
        tintColor: '#tint',
        expected: '#icon',
      },
      {
        name: 'falls back to tintColor when no icon colors provided',
        tintColor: '#tint',
        expected: '#tint',
      },
      {
        name: 'falls back to dynamic onSecondaryContainer when nothing is provided',
        expected: 'mock-onSecondaryContainer',
      },
    ];

    it.each(cases)('$name', ({ iconColor, selectedIconColor, tintColor, expected }) => {
      const result = createAndroidScreenAppearance({
        options: { iconColor, selectedIconColor },
        tintColor,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.selected?.tabBarItemIconColor).toBe(expected);
    });
  });

  describe('tabBarItemTitleLargeLabelFontSize', () => {
    it('uses selectedLabelStyle.fontSize when provided', () => {
      const result = createAndroidScreenAppearance({
        options: {
          labelStyle: { fontSize: 12 },
          selectedLabelStyle: { fontSize: 18 },
        },
        tintColor: undefined,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.tabBarItemTitleLargeLabelFontSize).toBe(18);
      expect(result.tabBarItemTitleSmallLabelFontSize).toBe(12);
    });

    it('falls back to labelStyle.fontSize when selectedLabelStyle.fontSize is missing', () => {
      const result = createAndroidScreenAppearance({
        options: {
          labelStyle: { fontSize: 12 },
        },
        tintColor: undefined,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.tabBarItemTitleLargeLabelFontSize).toBe(12);
      expect(result.tabBarItemTitleSmallLabelFontSize).toBe(12);
    });

    it('is undefined when neither label style provides fontSize', () => {
      const result = createAndroidScreenAppearance({
        options: {},
        tintColor: undefined,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.tabBarItemTitleLargeLabelFontSize).toBeUndefined();
      expect(result.tabBarItemTitleSmallLabelFontSize).toBeUndefined();
    });
  });

  it.each([
    [true, false],
    [false, true],
    [undefined, true],
  ])(
    'disableIndicator=%p sets tabBarItemActiveIndicatorEnabled=%p',
    (disableIndicator, enabled) => {
      const result = createAndroidScreenAppearance({
        options: {},
        tintColor: undefined,
        rippleColor: undefined,
        disableIndicator,
        labelVisibilityMode: undefined,
      });
      expect(result.tabBarItemActiveIndicatorEnabled).toBe(enabled);
    }
  );

  it.each([
    [700, 700],
    ['bold', 'bold'],
    ['500', '500'],
    [undefined, undefined],
  ] as const)(
    'forwards labelStyle.fontWeight=%p verbatim (Android does not stringify numeric weights)',
    (fontWeight, expected) => {
      const result = createAndroidScreenAppearance({
        options: { labelStyle: { fontWeight } },
        tintColor: undefined,
        rippleColor: undefined,
        disableIndicator: undefined,
        labelVisibilityMode: undefined,
      });
      expect(result.tabBarItemTitleFontWeight).toBe(expected);
    }
  );

  it.each(['auto', 'selected', 'labeled', 'unlabeled', undefined] as (
    | NativeTabsTabBarItemLabelVisibilityMode
    | undefined
  )[])('forwards labelVisibilityMode=%p verbatim', (labelVisibilityMode) => {
    const result = createAndroidScreenAppearance({
      options: {},
      tintColor: undefined,
      rippleColor: undefined,
      disableIndicator: undefined,
      labelVisibilityMode,
    });
    expect(result.tabBarItemLabelVisibilityMode).toBe(labelVisibilityMode);
  });
});
