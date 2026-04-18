'use client';
import { Animated, Platform, StyleSheet, } from 'react-native';
import { useTheme } from '../../native';
export function HeaderTitle({ tintColor, style, ...rest }) {
    const { colors, fonts } = useTheme();
    return (<Animated.Text role="heading" aria-level="1" numberOfLines={1} {...rest} style={[
            { color: tintColor === undefined ? colors.text : tintColor },
            Platform.select({ ios: fonts.bold, default: fonts.medium }),
            styles.title,
            style,
        ]}/>);
}
const styles = StyleSheet.create({
    title: Platform.select({
        ios: {
            fontSize: 17,
        },
        android: {
            fontSize: 20,
        },
        default: {
            fontSize: 18,
        },
    }),
});
//# sourceMappingURL=HeaderTitle.js.map