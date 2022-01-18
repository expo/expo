import { spacing, lightTheme, darkTheme, borderRadius } from '@expo/styleguide-native';
export const scale = {
    micro: spacing[0.5],
    tiny: spacing[1],
    small: spacing[3],
    medium: spacing[4],
    large: spacing[6],
    xl: spacing[8],
};
export const padding = {
    padding: {
        micro: { padding: scale.micro },
        tiny: { padding: scale.tiny },
        small: { padding: scale.small },
        medium: { padding: scale.medium },
        large: { padding: scale.large },
        xl: { padding: scale.xl },
    },
    px: {
        micro: { paddingHorizontal: scale.micro },
        tiny: { paddingHorizontal: scale.tiny },
        small: { paddingHorizontal: scale.small },
        medium: { paddingHorizontal: scale.medium },
        large: { paddingHorizontal: scale.large },
        xl: { paddingHorizontal: scale.xl },
    },
    py: {
        micro: { paddingVertical: scale.micro },
        tiny: { paddingVertical: scale.tiny },
        small: { paddingVertical: scale.small },
        medium: { paddingVertical: scale.medium },
        large: { paddingVertical: scale.large },
        xl: { paddingVertical: scale.xl },
    },
};
export const margin = {
    margin: {
        micro: { margin: scale.micro },
        tiny: { margin: scale.tiny },
        small: { margin: scale.small },
        medium: { margin: scale.medium },
        large: { margin: scale.large },
        xl: { margin: scale.xl },
    },
    mx: {
        micro: { marginHorizontal: scale.micro },
        tiny: { marginHorizontal: scale.tiny },
        small: { marginHorizontal: scale.small },
        medium: { marginHorizontal: scale.medium },
        large: { marginHorizontal: scale.large },
    },
    my: {
        micro: { marginHorizontal: scale.micro },
        tiny: { marginVertical: scale.tiny },
        small: { marginVertical: scale.small },
        medium: { marginVertical: scale.medium },
        large: { marginVertical: scale.large },
    },
};
export const rounded = {
    rounded: {
        none: { borderRadius: 0 },
        small: { borderRadius: borderRadius.small },
        medium: { borderRadius: borderRadius.medium },
        large: { borderRadius: borderRadius.large },
        full: { borderRadius: 99999 },
    },
    roundedTop: {
        none: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
        small: { borderTopLeftRadius: borderRadius.small, borderTopRightRadius: borderRadius.small },
        medium: {
            borderTopLeftRadius: borderRadius.medium,
            borderTopRightRadius: borderRadius.medium,
        },
        large: { borderTopLeftRadius: borderRadius.large, borderTopRightRadius: borderRadius.large },
        full: { borderTopLeftRadius: 9999, borderTopRightRadius: 9999 },
    },
    roundedBottom: {
        none: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
        small: {
            borderBottomLeftRadius: borderRadius.small,
            borderBottomRightRadius: borderRadius.small,
        },
        medium: {
            borderBottomLeftRadius: borderRadius.medium,
            borderBottomRightRadius: borderRadius.medium,
        },
        large: {
            borderBottomLeftRadius: borderRadius.large,
            borderBottomRightRadius: borderRadius.large,
        },
        full: { borderBottomLeftRadius: 9999, borderBottomRightRadius: 9999 },
    },
};
export const text = {
    align: {
        center: { textAlign: 'center' },
    },
    size: {
        small: {
            fontSize: 12,
            lineHeight: 14,
        },
        medium: {
            fontSize: 16,
            lineHeight: 18,
        },
        large: {
            fontSize: 18,
            lineHeight: 24,
        },
    },
    leading: {
        large: { lineHeight: 18 },
    },
    type: {
        mono: {
            fontFamily: 'Menlo',
        },
    },
    weight: {
        thin: { fontWeight: '100' },
        extralight: { fontWeight: '200' },
        light: { fontWeight: '300' },
        normal: { fontWeight: '400' },
        medium: { fontWeight: '500' },
        semibold: { fontWeight: '600' },
        bold: { fontWeight: '700' },
        extrabold: { fontWeight: '800' },
        black: { fontWeight: '900' },
    },
    color: {
        default: { color: lightTheme.text.default },
        error: { color: lightTheme.text.error },
        warning: { color: lightTheme.text.warning },
        success: { color: lightTheme.text.success },
        secondary: { color: lightTheme.text.secondary },
        primary: { color: lightTheme.button.primary.background },
    },
};
export const textDark = {
    base: {
        color: darkTheme.text.default,
    },
    color: {
        default: { color: darkTheme.text.default },
        error: { color: darkTheme.text.error },
        warning: { color: darkTheme.text.warning },
        success: { color: darkTheme.text.success },
        secondary: { color: darkTheme.text.secondary },
        primary: { color: darkTheme.button.primary.background },
    },
};
export const bg = {
    none: { backgroundColor: 'transparent' },
    default: { backgroundColor: lightTheme.background.default },
    secondary: { backgroundColor: lightTheme.background.secondary },
    success: { backgroundColor: lightTheme.background.success },
    warning: { backgroundColor: lightTheme.background.warning },
    error: { backgroundColor: lightTheme.background.error },
};
export const bgDark = {
    default: { backgroundColor: darkTheme.background.default },
    secondary: { backgroundColor: darkTheme.background.secondary },
    success: { backgroundColor: darkTheme.background.success },
    warning: { backgroundColor: darkTheme.background.warning },
    error: { backgroundColor: darkTheme.background.error },
};
export const lightNavigationTheme = {
    dark: false,
    colors: {
        primary: lightTheme.button.primary.background,
        background: lightTheme.background.secondary,
        card: lightTheme.background.default,
        text: lightTheme.text.default,
        border: lightTheme.border.default,
        notification: lightTheme.highlight.accent,
    },
};
export const darkNavigationTheme = {
    dark: true,
    colors: {
        primary: darkTheme.button.primary.background,
        background: darkTheme.background.secondary,
        card: darkTheme.background.default,
        text: darkTheme.text.default,
        border: darkTheme.border.default,
        notification: darkTheme.highlight.accent,
    },
};
//# sourceMappingURL=theme.js.map