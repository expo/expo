import { StyleSheet } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

import type { NativeStackOptions } from './types';

/**
 * Converts `NativeStackOptions` to `ScreenStackHeaderConfigProps` for `ScreenStackItem`.
 */
export function convertOptionsToHeaderConfig(
  options: NativeStackOptions,
  routeName: string,
  canGoBack: boolean
): ScreenStackHeaderConfigProps {
  const titleStyle = StyleSheet.flatten(options.headerTitleStyle) || {};
  const largeTitleStyle = StyleSheet.flatten(options.headerLargeTitleStyle) || {};

  const blurEffect = options.headerBlurEffect;
  const largeTitle = options.headerLargeTitle;
  const transparent = options.headerTransparent;

  return {
    title: options.title ?? routeName,
    hidden: options.headerShown === false,
    backTitle: options.headerBackTitle,
    backButtonDisplayMode: options.headerBackButtonDisplayMode,
    color: options.headerTintColor,
    backgroundColor: options.headerBackgroundColor,
    blurEffect,
    largeTitle,
    largeTitleBackgroundColor: options.headerLargeTitleBackgroundColor,
    hideShadow: options.headerShadowVisible === false,
    translucent: transparent === true || blurEffect != null || largeTitle === true,
    hideBackButton: !canGoBack,
    titleFontFamily: titleStyle.fontFamily,
    titleFontSize: titleStyle.fontSize,
    titleFontWeight: titleStyle.fontWeight != null ? String(titleStyle.fontWeight) : undefined,
    titleColor: titleStyle.color,
    largeTitleFontFamily: largeTitleStyle.fontFamily,
    largeTitleFontSize: largeTitleStyle.fontSize,
    largeTitleFontWeight:
      largeTitleStyle.fontWeight != null ? String(largeTitleStyle.fontWeight) : undefined,
    largeTitleColor: largeTitleStyle.color,
  };
}
