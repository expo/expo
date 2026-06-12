import type { TabsScreenAppearanceAndroid, TabsScreenAppearanceIOS } from 'react-native-screens';

import type { NativeTabOptions } from './types';

export function createStandardAppearanceFromOptions(
  _options: NativeTabOptions
): TabsScreenAppearanceIOS {
  return {};
}

export function createScrollEdgeAppearanceFromOptions(
  _options: NativeTabOptions
): TabsScreenAppearanceIOS {
  return appendStyleToAppearance(selectedStyle, appearance, ['selected', 'focused']);
}

const EMPTY_APPEARANCE_ITEM: TabsScreenItemAppearanceIOS = {
  normal: {},
  selected: {},
  focused: {},
  disabled: {},
};

export function appendStyleToAppearance(
  style: AppearanceStyle,
  appearance: TabsScreenAppearanceIOS,
  states: ('selected' | 'focused' | 'disabled' | 'normal')[]
): TabsScreenAppearanceIOS {
  const baseItemAppearance =
    appearance.stacked || appearance.inline || appearance.compactInline || {};

  const styleAppearance = convertStyleToAppearance(style);
  const newAppearances = states.map((state) => ({
    key: state,
    appearance: {
      ...baseItemAppearance.normal,
      ...baseItemAppearance[state],
      ...styleAppearance.stacked?.normal,
      ...styleAppearance.stacked?.[state],
    },
  }));

  const itemAppearance: TabsScreenItemAppearanceIOS = {
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
    tabBarBlurEffect: styleAppearance.tabBarBlurEffect ?? appearance.tabBarBlurEffect,
    tabBarShadowColor: styleAppearance.tabBarShadowColor ?? appearance.tabBarShadowColor,
  };
  return {};
}

export function createAndroidScreenAppearance(
  _options: NativeTabOptions
): TabsScreenAppearanceAndroid {
  return {} as TabsScreenAppearanceAndroid;
}
