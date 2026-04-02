'use client';
import * as React from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Color } from '../../../utils/color';
import { PlatformPressable, Text } from '../../elements';
import { type Route, useTheme } from '../../native';

type Props = {
  /**
   * The route object which should be specified by the drawer item.
   */
  route?: Route<string>;
  /**
   * The `href` to use for the anchor tag on web
   */
  href?: string;
  /**
   * The label text of the item.
   */
  label: string | ((props: { focused: boolean; color: ColorValue }) => React.ReactNode);
  /**
   * Icon to display for the `DrawerItem`.
   */
  icon?: (props: { focused: boolean; size: number; color: ColorValue }) => React.ReactNode;
  /**
   * Whether to highlight the drawer item as active.
   */
  focused?: boolean;
  /**
   * Function to execute on press.
   */
  onPress: () => void;
  /**
   * Color for the icon and label when the item is active.
   */
  activeTintColor?: ColorValue;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: ColorValue;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: ColorValue;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: ColorValue;
  /**
   * Color of the touchable effect on press.
   * Only supported on Android.
   *
   * @platform android
   */
  pressColor?: ColorValue;
  /**
   * Opacity of the touchable effect on press.
   * Only supported on iOS.
   *
   * @platform ios
   */
  pressOpacity?: number;
  /**
   * Style object for the label element.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Style object for the wrapper element.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  allowFontScaling?: boolean;

  /**
   * Accessibility label for drawer item.
   */
  accessibilityLabel?: string;
  /**
   * ID to locate this drawer item in tests.
   */
  testID?: string;
};

/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export function DrawerItem(props: Props) {
  const { colors, fonts } = useTheme();

  const {
    href,
    icon,
    label,
    labelStyle,
    focused = false,
    allowFontScaling,
    activeTintColor = colors.primary,
    inactiveTintColor,
    activeBackgroundColor,
    inactiveBackgroundColor = 'transparent',
    style,
    onPress,
    pressColor,
    pressOpacity = 1,
    testID,
    accessibilityLabel,
    ...rest
  } = props;

  const { borderRadius = 56 } = StyleSheet.flatten(style || {});
  const color: ColorValue = focused
    ? activeTintColor
    : (inactiveTintColor ?? Color(colors.text)?.alpha(0.68).string() ?? colors.text);
  const backgroundColor: ColorValue = focused
    ? (activeBackgroundColor ?? Color(activeTintColor)?.alpha(0.12).string() ?? 'transparent')
    : inactiveBackgroundColor;

  const iconNode = icon ? icon({ size: 24, focused, color }) : null;

  return (
    <View
      collapsable={false}
      {...rest}
      style={[styles.container, { borderRadius, backgroundColor }, style]}>
      <PlatformPressable
        testID={testID}
        onPress={onPress}
        role="button"
        aria-label={accessibilityLabel}
        aria-selected={focused}
        pressColor={pressColor}
        pressOpacity={pressOpacity}
        hoverEffect={{ color }}
        href={href}>
        <View style={[styles.wrapper, { borderRadius }]}>
          {iconNode}
          <View style={[styles.label, { marginStart: iconNode ? 12 : 0 }]}>
            {typeof label === 'string' ? (
              <Text
                numberOfLines={1}
                allowFontScaling={allowFontScaling}
                style={[styles.labelText, { color }, fonts.medium, labelStyle]}>
                {label}
              </Text>
            ) : (
              label({ color, focused })
            )}
          </View>
        </View>
      </PlatformPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingStart: 16,
    paddingEnd: 24,
    borderCurve: 'continuous',
  },
  label: {
    marginEnd: 12,
    marginVertical: 4,
    flex: 1,
  },
  labelText: {
    lineHeight: 24,
    textAlignVertical: 'center',
  },
});
