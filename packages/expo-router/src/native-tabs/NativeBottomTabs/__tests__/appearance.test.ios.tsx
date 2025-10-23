import type {
  BottomTabsScreenAppearance,
  BottomTabsScreenItemAppearance,
  BottomTabsScreenItemStateAppearance,
} from 'react-native-screens';

import {
  appendStyleToAppearance,
  convertStyleToAppearance,
  convertStyleToItemStateAppearance,
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
  type AppearanceStyle,
} from '../appearance';
import type { NativeTabOptions } from '../types';

describe(createStandardAppearanceFromOptions, () => {
  it('empty options should create empty appearance', () => {
    const options: NativeTabOptions = {};
    const baseAppearance = {};
    const result = createStandardAppearanceFromOptions(options, baseAppearance);
    const expectedItemAppearance: BottomTabsScreenItemAppearance = {
      normal: {},
      selected: {},
      disabled: {},
      focused: {},
    };
    const expectedAppearance: BottomTabsScreenAppearance = {
      stacked: expectedItemAppearance,
      inline: expectedItemAppearance,
      compactInline: expectedItemAppearance,
    };
    expect(result).toEqual(expectedAppearance);
  });
  it.each([true, false, undefined])(
    'should create correct appearance with disableTransparentOnScrollEdge: %p',
    (disableTransparentOnScrollEdge) => {
      const options: NativeTabOptions = {
        iconColor: 'red',
        selectedIconColor: 'blue',
        backgroundColor: 'white',
        badgeBackgroundColor: 'green',
        shadowColor: 'gray',
        titlePositionAdjustment: { horizontal: 10, vertical: 20 },
        labelStyle: {
          fontSize: 20,
        },
        selectedLabelStyle: {
          fontSize: 30,
        },
        disableTransparentOnScrollEdge,
      };
      const baseAppearanceItem: BottomTabsScreenItemAppearance = {
        normal: { tabBarItemBadgeBackgroundColor: 'orange', tabBarItemIconColor: 'purple' },
        selected: { tabBarItemTitleFontSize: 10, tabBarItemIconColor: 'black' },
        focused: { tabBarItemTitleFontSize: 10, tabBarItemIconColor: 'black' },
        disabled: {},
      };
      const baseAppearance: BottomTabsScreenAppearance = {
        stacked: baseAppearanceItem,
        inline: baseAppearanceItem,
        compactInline: baseAppearanceItem,
        tabBarBackgroundColor: '#fff',
        tabBarBlurEffect: 'light',
        tabBarShadowColor: 'blue',
      };

      const result = createStandardAppearanceFromOptions(options, baseAppearance);

      const expectedItemAppearance: BottomTabsScreenItemAppearance = {
        normal: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'red',
          tabBarItemTitleFontSize: 20,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        selected: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'blue',
          tabBarItemTitleFontSize: 30,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        focused: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'blue',
          tabBarItemTitleFontSize: 30,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        disabled: {},
      };
      const expectedAppearance: BottomTabsScreenAppearance = {
        stacked: expectedItemAppearance,
        inline: expectedItemAppearance,
        compactInline: expectedItemAppearance,
        tabBarBackgroundColor: 'white',
        tabBarBlurEffect: 'light',
        tabBarShadowColor: 'gray',
      };
      expect(result).toEqual(expectedAppearance);
    }
  );
});

describe(createScrollEdgeAppearanceFromOptions, () => {
  it('empty options should create empty appearance', () => {
    const options: NativeTabOptions = {};
    const baseAppearance = {};
    const result = createScrollEdgeAppearanceFromOptions(options, baseAppearance);
    const expectedItemAppearance: BottomTabsScreenItemAppearance = {
      normal: {},
      selected: {},
      disabled: {},
      focused: {},
    };
    const expectedAppearance: BottomTabsScreenAppearance = {
      stacked: expectedItemAppearance,
      inline: expectedItemAppearance,
      compactInline: expectedItemAppearance,
      tabBarBackgroundColor: undefined,
      tabBarBlurEffect: 'none',
      tabBarShadowColor: 'transparent',
    };
    expect(result).toEqual(expectedAppearance);
  });
  it.each([true, false, undefined])(
    'should create correct appearance for scroll edge with disableTransparentOnScrollEdge: %p',
    (disableTransparentOnScrollEdge) => {
      const options: NativeTabOptions = {
        iconColor: 'red',
        selectedIconColor: 'blue',
        backgroundColor: 'white',
        badgeBackgroundColor: 'green',
        shadowColor: 'blue',
        titlePositionAdjustment: { horizontal: 10, vertical: 20 },
        labelStyle: {
          fontSize: 20,
        },
        selectedLabelStyle: {
          fontSize: 30,
        },
        disableTransparentOnScrollEdge,
      };
      const baseAppearanceItem: BottomTabsScreenItemAppearance = {
        normal: { tabBarItemBadgeBackgroundColor: 'orange', tabBarItemIconColor: 'purple' },
        selected: { tabBarItemTitleFontSize: 10, tabBarItemIconColor: 'black' },
        focused: { tabBarItemTitleFontSize: 10, tabBarItemIconColor: 'black' },
        disabled: {},
      };
      const baseAppearance: BottomTabsScreenAppearance = {
        stacked: baseAppearanceItem,
        inline: baseAppearanceItem,
        compactInline: baseAppearanceItem,
        tabBarBackgroundColor: '#fff',
        tabBarBlurEffect: 'light',
        tabBarShadowColor: 'gray',
      };
      const result = createScrollEdgeAppearanceFromOptions(options, baseAppearance);
      const expectedItemAppearance: BottomTabsScreenItemAppearance = {
        normal: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'red',
          tabBarItemTitleFontSize: 20,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        selected: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'blue',
          tabBarItemTitleFontSize: 30,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        focused: {
          tabBarItemBadgeBackgroundColor: 'green',
          tabBarItemIconColor: 'blue',
          tabBarItemTitleFontSize: 30,
          tabBarItemTitlePositionAdjustment: { horizontal: 10, vertical: 20 },
        },
        disabled: {},
      };
      const expectedAppearance: BottomTabsScreenAppearance = {
        stacked: expectedItemAppearance,
        inline: expectedItemAppearance,
        compactInline: expectedItemAppearance,
        tabBarBackgroundColor: disableTransparentOnScrollEdge ? 'white' : undefined,
        tabBarBlurEffect: disableTransparentOnScrollEdge ? 'light' : 'none',
        tabBarShadowColor: disableTransparentOnScrollEdge ? 'blue' : 'transparent',
      };
      expect(result).toEqual(expectedAppearance);
    }
  );
});

describe(appendStyleToAppearance, () => {
  describe.each([
    [['normal']],
    [['normal', 'focused']],
    [['normal', 'focused', 'selected']],
  ] as (keyof BottomTabsScreenItemAppearance)[][][])('for states %p', (states) => {
    it.each([
      [
        {
          stacked: {
            normal: {},
            selected: {},
            focused: {},
            disabled: {},
          },
          inline: {
            normal: {},
            selected: {},
            focused: {},
            disabled: {},
          },
          compactInline: {
            normal: {},
            selected: {},
            focused: {},
            disabled: {},
          },
        },
      ],
      [
        {
          stacked: {
            normal: { tabBarItemTitleFontSize: 10 },
            selected: { tabBarItemTitleFontSize: 20 },
            focused: { tabBarItemTitleFontSize: 30 },
            disabled: {},
          },
          inline: {
            normal: { tabBarItemTitleFontSize: 10 },
            selected: { tabBarItemTitleFontSize: 20 },
            focused: { tabBarItemTitleFontSize: 30 },
            disabled: {},
          },
          compactInline: {
            normal: { tabBarItemTitleFontSize: 10 },
            selected: { tabBarItemTitleFontSize: 20 },
            focused: { tabBarItemTitleFontSize: 30 },
            disabled: {},
          },
        },
      ],
    ] as [BottomTabsScreenAppearance][])(
      'empty style should not change appearance %p',
      (appearance) => {
        const result = appendStyleToAppearance({}, appearance, states);
        expect(result).toEqual(appearance);
      }
    );
    it('should append style correctly', () => {
      const item: BottomTabsScreenItemAppearance = {
        normal: {
          tabBarItemIconColor: '#f00',
          tabBarItemBadgeBackgroundColor: '#0f0',
          tabBarItemTitleFontWeight: '700',
        },
        selected: {
          tabBarItemIconColor: 'orange',
        },
        focused: {},
        disabled: {},
      };
      const appearance: BottomTabsScreenAppearance = {
        stacked: item,
        inline: item,
        compactInline: item,
        tabBarBackgroundColor: '#000',
        tabBarBlurEffect: 'none',
      };
      const style: AppearanceStyle = {
        backgroundColor: '#fff',
        fontWeight: 100,
        iconColor: 'red',
        fontSize: 100,
      };
      const result = appendStyleToAppearance(style, appearance, states);
      const newStateAppearance = {
        tabBarItemIconColor: 'red',
        tabBarItemTitleFontWeight: '100',
        tabBarItemTitleFontSize: 100,
      } as const;
      const normal = states.includes('normal')
        ? {
            ...item.normal,
            ...newStateAppearance,
          }
        : item.normal;
      const selected = states.includes('selected')
        ? {
            ...item.normal,
            ...item.selected,
            ...newStateAppearance,
          }
        : item.selected;
      const focused = states.includes('focused')
        ? {
            ...item.normal,
            ...item.focused,
            ...newStateAppearance,
          }
        : item.focused;
      const expectedItem: BottomTabsScreenItemAppearance = {
        normal,
        selected,
        focused,
        disabled: {},
      };
      expect(result).toEqual({
        stacked: expectedItem,
        inline: expectedItem,
        compactInline: expectedItem,
        tabBarBackgroundColor: '#fff',
        tabBarBlurEffect: 'none',
      });
    });

    it('should convert empty object to valid appearance', () => {
      const style: AppearanceStyle = {
        backgroundColor: '#fff',
        fontWeight: 100,
        iconColor: 'red',
        fontSize: 100,
      };
      const result = appendStyleToAppearance(style, {}, states);
      const newStateAppearance = {
        tabBarItemIconColor: 'red',
        tabBarItemTitleFontWeight: '100',
        tabBarItemTitleFontSize: 100,
      } as const;
      const normal = states.includes('normal') ? newStateAppearance : {};
      const selected = states.includes('selected') ? newStateAppearance : {};
      const focused = states.includes('focused') ? newStateAppearance : {};
      const expectedItem: BottomTabsScreenItemAppearance = {
        normal,
        selected,
        focused,
        disabled: {},
      };
      expect(result).toEqual({
        stacked: expectedItem,
        inline: expectedItem,
        compactInline: expectedItem,
        tabBarBackgroundColor: '#fff',
      });
    });
  });
});

describe(convertStyleToAppearance, () => {
  it('adds background and blur only to the top appearance', () => {
    const style: AppearanceStyle = {
      backgroundColor: '#fff',
      blurEffect: 'light',
      fontFamily: 'Arial',
    };
    const expected: BottomTabsScreenItemStateAppearance = {
      tabBarItemTitleFontFamily: 'Arial',
    };
    const result = convertStyleToAppearance(style);
    const state = {
      normal: expected,
      selected: expected,
      disabled: {},
      focused: expected,
    };
    expect(result).toEqual({
      stacked: state,
      inline: state,
      compactInline: state,
      tabBarBackgroundColor: style.backgroundColor,
      tabBarBlurEffect: style.blurEffect,
    });
  });
  const cases: [AppearanceStyle, BottomTabsScreenItemStateAppearance][] = [
    [{}, {}],
    [{ fontFamily: 'xxx' }, { tabBarItemTitleFontFamily: 'xxx' }],
    [{ fontSize: 16 }, { tabBarItemTitleFontSize: 16 }],
    [{ fontWeight: '700' }, { tabBarItemTitleFontWeight: '700' }],
    [{ fontWeight: 700 }, { tabBarItemTitleFontWeight: '700' }],
    [{ fontStyle: 'italic' }, { tabBarItemTitleFontStyle: 'italic' }],
    [{ color: '#123456' }, { tabBarItemTitleFontColor: '#123456' }],
    [{ iconColor: '#abcdef' }, { tabBarItemIconColor: '#abcdef' }],
    [{ badgeBackgroundColor: '#ff0000' }, { tabBarItemBadgeBackgroundColor: '#ff0000' }],
    [
      { titlePositionAdjustment: { horizontal: 5, vertical: -2 } },
      { tabBarItemTitlePositionAdjustment: { horizontal: 5, vertical: -2 } },
    ],
    [
      {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'italic',
        color: '#111',
        iconColor: '#222',
        badgeBackgroundColor: '#333',
        titlePositionAdjustment: { horizontal: 2, vertical: 3 },
      },
      {
        tabBarItemTitleFontFamily: 'Arial',
        tabBarItemTitleFontSize: 14,
        tabBarItemTitleFontWeight: '600',
        tabBarItemTitleFontStyle: 'italic',
        tabBarItemTitleFontColor: '#111',
        tabBarItemIconColor: '#222',
        tabBarItemBadgeBackgroundColor: '#333',
        tabBarItemTitlePositionAdjustment: { horizontal: 2, vertical: 3 },
      },
    ],
    [
      {
        fontFamily: 'Verdana',
        fontWeight: 700,
        color: '#abc',
        iconColor: '#def',
      },
      {
        tabBarItemTitleFontFamily: 'Verdana',
        tabBarItemTitleFontWeight: '700',
        tabBarItemTitleFontColor: '#abc',
        tabBarItemIconColor: '#def',
      },
    ],
    [
      {
        fontStyle: 'normal',
        badgeBackgroundColor: '#f00',
        titlePositionAdjustment: { horizontal: 0 },
      },
      {
        tabBarItemTitleFontStyle: 'normal',
        tabBarItemBadgeBackgroundColor: '#f00',
        tabBarItemTitlePositionAdjustment: { horizontal: 0 },
      },
    ],
  ];
  it.each(cases)('style %p should create appearance %p', (style, expected) => {
    const result = convertStyleToAppearance(style);
    const state = {
      normal: expected,
      selected: expected,
      disabled: {},
      focused: expected,
    };
    expect(result).toEqual({
      stacked: state,
      inline: state,
      compactInline: state,
    });
  });
});
describe(convertStyleToItemStateAppearance, () => {
  const cases: [AppearanceStyle, BottomTabsScreenItemStateAppearance][] = [
    [{}, {}],
    [{ backgroundColor: '#fff' }, {}],
    [{ blurEffect: 'none' }, {}],
    [{ fontFamily: 'xxx' }, { tabBarItemTitleFontFamily: 'xxx' }],
    [{ fontSize: 16 }, { tabBarItemTitleFontSize: 16 }],
    [{ fontWeight: '700' }, { tabBarItemTitleFontWeight: '700' }],
    [{ fontWeight: 700 }, { tabBarItemTitleFontWeight: '700' }],
    [{ fontStyle: 'italic' }, { tabBarItemTitleFontStyle: 'italic' }],
    [{ color: '#123456' }, { tabBarItemTitleFontColor: '#123456' }],
    [{ iconColor: '#abcdef' }, { tabBarItemIconColor: '#abcdef' }],
    [{ badgeBackgroundColor: '#ff0000' }, { tabBarItemBadgeBackgroundColor: '#ff0000' }],
    [
      { titlePositionAdjustment: { horizontal: 5, vertical: -2 } },
      { tabBarItemTitlePositionAdjustment: { horizontal: 5, vertical: -2 } },
    ],
    [
      {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'italic',
        color: '#111',
        iconColor: '#222',
        badgeBackgroundColor: '#333',
        titlePositionAdjustment: { horizontal: 2, vertical: 3 },
      },
      {
        tabBarItemTitleFontFamily: 'Arial',
        tabBarItemTitleFontSize: 14,
        tabBarItemTitleFontWeight: '600',
        tabBarItemTitleFontStyle: 'italic',
        tabBarItemTitleFontColor: '#111',
        tabBarItemIconColor: '#222',
        tabBarItemBadgeBackgroundColor: '#333',
        tabBarItemTitlePositionAdjustment: { horizontal: 2, vertical: 3 },
      },
    ],
    [
      {
        fontFamily: 'Verdana',
        fontWeight: 700,
        color: '#abc',
        iconColor: '#def',
      },
      {
        tabBarItemTitleFontFamily: 'Verdana',
        tabBarItemTitleFontWeight: '700',
        tabBarItemTitleFontColor: '#abc',
        tabBarItemIconColor: '#def',
      },
    ],
    [
      {
        fontStyle: 'normal',
        badgeBackgroundColor: '#f00',
        titlePositionAdjustment: { horizontal: 0 },
      },
      {
        tabBarItemTitleFontStyle: 'normal',
        tabBarItemBadgeBackgroundColor: '#f00',
        tabBarItemTitlePositionAdjustment: { horizontal: 0 },
      },
    ],
  ];
  it.each(cases)('style %p should create item state appearance %p', (style, expected) => {
    const result = convertStyleToItemStateAppearance(style);
    expect(result).toEqual(expected);
  });
});
