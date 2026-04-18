'use client';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from '../../../utils/color';
import { PlatformPressable, Text } from '../../elements';
import { useTheme } from '../../native';
/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export function DrawerItem(props) {
    const { colors, fonts } = useTheme();
    const { href, icon, label, labelStyle, focused = false, allowFontScaling, activeTintColor = colors.primary, inactiveTintColor, activeBackgroundColor, inactiveBackgroundColor = 'transparent', style, onPress, pressColor, pressOpacity = 1, testID, accessibilityLabel, ...rest } = props;
    const { borderRadius = 56 } = StyleSheet.flatten(style || {});
    const color = focused
        ? activeTintColor
        : (inactiveTintColor ?? Color(colors.text)?.alpha(0.68).string() ?? colors.text);
    const backgroundColor = focused
        ? (activeBackgroundColor ?? Color(activeTintColor)?.alpha(0.12).string() ?? 'transparent')
        : inactiveBackgroundColor;
    const iconNode = icon ? icon({ size: 24, focused, color }) : null;
    return (<View collapsable={false} {...rest} style={[styles.container, { borderRadius, backgroundColor }, style]}>
      <PlatformPressable testID={testID} onPress={onPress} role="button" aria-label={accessibilityLabel} aria-selected={focused} pressColor={pressColor} pressOpacity={pressOpacity} hoverEffect={{ color }} href={href}>
        <View style={[styles.wrapper, { borderRadius }]}>
          {iconNode}
          <View style={[styles.label, { marginStart: iconNode ? 12 : 0 }]}>
            {typeof label === 'string' ? (<Text numberOfLines={1} allowFontScaling={allowFontScaling} style={[styles.labelText, { color }, fonts.medium, labelStyle]}>
                {label}
              </Text>) : (label({ color, focused }))}
          </View>
        </View>
      </PlatformPressable>
    </View>);
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
//# sourceMappingURL=DrawerItem.js.map