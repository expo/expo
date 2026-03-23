import { PlatformPressable, Text } from '@react-navigation/elements';
import { type Route, useTheme } from '@react-navigation/native';
import Color from 'color';
import * as React from 'react';
import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

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
  label:
    | string
    | ((props: { focused: boolean; color: string }) => React.ReactNode);
  /**
   * Icon to display for the `DrawerItem`.
   */
  icon?: (props: {
    focused: boolean;
    size: number;
    color: string;
  }) => React.ReactNode;
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
  activeTintColor?: string;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: string;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: string;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: string;
  /**
   * Color of the touchable effect on press.
   * Only supported on Android.
   *
   * @platform android
   */
  pressColor?: string;
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
    // eslint-disable-next-line @eslint-react/no-unstable-default-props
    inactiveTintColor = Color(colors.text).alpha(0.68).rgb().string(),
    // eslint-disable-next-line @eslint-react/no-unstable-default-props
    activeBackgroundColor = Color(activeTintColor).alpha(0.12).rgb().string(),
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
  const color = focused ? activeTintColor : inactiveTintColor;
  const backgroundColor = focused
    ? activeBackgroundColor
    : inactiveBackgroundColor;

  const iconNode = icon ? icon({ size: 24, focused, color }) : null;

  return (
    <View
      collapsable={false}
      {...rest}
      style={[styles.container, { borderRadius, backgroundColor }, style]}
    >
      <PlatformPressable
        testID={testID}
        onPress={onPress}
        role="button"
        aria-label={accessibilityLabel}
        aria-selected={focused}
        pressColor={pressColor}
        pressOpacity={pressOpacity}
        hoverEffect={{ color }}
        href={href}
      >
        <View style={[styles.wrapper, { borderRadius }]}>
          {iconNode}
          <View style={[styles.label, { marginStart: iconNode ? 12 : 0 }]}>
            {typeof label === 'string' ? (
              <Text
                numberOfLines={1}
                allowFontScaling={allowFontScaling}
                style={[styles.labelText, { color }, fonts.medium, labelStyle]}
              >
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
