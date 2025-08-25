import type { ColorValue } from 'react-native';
import type {
  BottomTabsScreenAppearance,
  BottomTabsScreenItemAppearance,
  BottomTabsScreenItemStateAppearance,
} from 'react-native-screens';

import {
  SUPPORTED_BLUR_EFFECTS,
  type NativeTabOptions,
  type NativeTabsBlurEffect,
  type NativeTabsLabelStyle,
} from './types';

export function createStandardAppearanceFromOptions(
  options: NativeTabOptions,
  baseStandardAppearance: BottomTabsScreenAppearance
): BottomTabsScreenAppearance {
  const appearance = appendStyleToAppearance(
    {
      ...options.labelStyle,
      iconColor: options.iconColor,
      backgroundColor: options.backgroundColor,
      blurEffect: options.blurEffect,
      badgeBackgroundColor: options.badgeBackgroundColor,
      titlePositionAdjustment: options.titlePositionAdjustment,
    },
    baseStandardAppearance,
    ['normal', 'focused', 'selected']
  );
  return appendSelectedStyleToAppearance(
    {
      ...(options.selectedLabelStyle ?? {}),
      iconColor: options.selectedIconColor,
      badgeBackgroundColor: options.selectedBadgeBackgroundColor,
      titlePositionAdjustment: options.selectedTitlePositionAdjustment,
    },
    appearance
  );
}

export function createScrollEdgeAppearanceFromOptions(
  options: NativeTabOptions,
  baseScrollEdgeAppearance: BottomTabsScreenAppearance
): BottomTabsScreenAppearance {
  const appearance = appendStyleToAppearance(
    {
      ...options.labelStyle,
      iconColor: options.iconColor,
      blurEffect: options.disableTransparentOnScrollEdge ? options.blurEffect : 'none',
      backgroundColor: options.disableTransparentOnScrollEdge ? options.backgroundColor : null,
      badgeBackgroundColor: options.badgeBackgroundColor,
      titlePositionAdjustment: options.titlePositionAdjustment,
    },
    baseScrollEdgeAppearance,
    ['normal', 'focused', 'selected']
  );
  return appendSelectedStyleToAppearance(
    {
      ...(options.selectedLabelStyle ?? {}),
      iconColor: options.selectedIconColor,
      badgeBackgroundColor: options.selectedBadgeBackgroundColor,
      titlePositionAdjustment: options.selectedTitlePositionAdjustment,
    },
    appearance
  );
}

export interface AppearanceStyle extends NativeTabsLabelStyle {
  iconColor?: ColorValue;
  backgroundColor?: ColorValue | null;
  blurEffect?: NativeTabsBlurEffect;
  badgeBackgroundColor?: ColorValue;
  titlePositionAdjustment?: {
    horizontal?: number;
    vertical?: number;
  };
}

export function appendSelectedStyleToAppearance(
  selectedStyle: AppearanceStyle,
  appearance: BottomTabsScreenAppearance
): BottomTabsScreenAppearance {
  return appendStyleToAppearance(selectedStyle, appearance, ['selected', 'focused']);
}

const EMPTY_APPEARANCE_ITEM: BottomTabsScreenItemAppearance = {
  normal: {},
  selected: {},
  focused: {},
  disabled: {},
};

export function appendStyleToAppearance(
  style: AppearanceStyle,
  appearance: BottomTabsScreenAppearance,
  states: ('selected' | 'focused' | 'disabled' | 'normal')[]
): BottomTabsScreenAppearance {
  let tabBarBlurEffect = style?.blurEffect;
  if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
    console.warn(
      `Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`
    );
    tabBarBlurEffect = undefined;
  }
  const baseItemAppearance =
    appearance.stacked || appearance.inline || appearance.compactInline || {};

  const styleAppearance = convertStyleToAppearance(style);
  const newAppearances = states.map((state) => ({
    key: state,
    appearance: {
      ...baseItemAppearance.normal,
      ...baseItemAppearance[state],
      ...styleAppearance.stacked?.normal,
    },
  }));

  const itemAppearance: BottomTabsScreenItemAppearance = {
    ...EMPTY_APPEARANCE_ITEM,
    ...baseItemAppearance,
    ...Object.fromEntries(newAppearances.map(({ key, appearance }) => [key, appearance])),
  };
  return {
    stacked: itemAppearance,
    inline: itemAppearance,
    compactInline: itemAppearance,
    tabBarBackgroundColor:
      style.backgroundColor === null
        ? undefined
        : (style.backgroundColor ?? appearance.tabBarBackgroundColor),
    tabBarBlurEffect: tabBarBlurEffect ?? appearance.tabBarBlurEffect,
  };
}

const supportedBlurEffectsSet = new Set<string>(SUPPORTED_BLUR_EFFECTS);

export function convertStyleToAppearance(
  style: AppearanceStyle | undefined
): BottomTabsScreenAppearance {
  if (!style) {
    return {};
  }
  let blurEffect = style.blurEffect;
  if (style.blurEffect && !supportedBlurEffectsSet.has(style.blurEffect)) {
    console.warn(
      `Unsupported blurEffect: ${style.blurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map(
        (effect) => `"${effect}"`
      ).join(', ')}`
    );
    blurEffect = undefined;
  }
  const stateAppearance = convertStyleToItemStateAppearance(style);
  const itemAppearance: BottomTabsScreenItemAppearance = {
    normal: stateAppearance,
    selected: stateAppearance,
    focused: stateAppearance,
    disabled: {},
  };
  return {
    inline: itemAppearance,
    stacked: itemAppearance,
    compactInline: itemAppearance,
    tabBarBackgroundColor: style?.backgroundColor ?? undefined,
    tabBarBlurEffect: blurEffect,
  };
}

export function convertStyleToItemStateAppearance(
  style: AppearanceStyle | undefined
): BottomTabsScreenItemStateAppearance {
  if (!style) {
    return {};
  }
  const stateAppearance: BottomTabsScreenItemStateAppearance = {
    tabBarItemBadgeBackgroundColor: style.badgeBackgroundColor,
    tabBarItemTitlePositionAdjustment: style.titlePositionAdjustment,
    tabBarItemIconColor: style.iconColor,
    tabBarItemTitleFontFamily: style.fontFamily,
    tabBarItemTitleFontSize: style.fontSize,
    // Only string values are accepted by rn-screens
    tabBarItemTitleFontWeight: style?.fontWeight
      ? (String(style.fontWeight) as `${NonNullable<(typeof style)['fontWeight']>}`)
      : undefined,
    tabBarItemTitleFontStyle: style.fontStyle,
    tabBarItemTitleFontColor: style.color,
  };

  (Object.keys(stateAppearance) as (keyof BottomTabsScreenItemStateAppearance)[]).forEach((key) => {
    if (stateAppearance[key] === undefined) {
      delete stateAppearance[key];
    }
  });

  return stateAppearance;
}
