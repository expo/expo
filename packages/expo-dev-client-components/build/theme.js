import { spacing, lightTheme, darkTheme } from '@expo/styleguide-native';
export const scale = {
    micro: spacing[0.5],
    tiny: spacing[1],
    small: spacing[3],
    medium: spacing[4],
    large: spacing[8],
};
export const padding = {
    padding: {
        micro: { padding: scale.micro },
        tiny: { padding: scale.tiny },
        small: { padding: scale.small },
        medium: { padding: scale.medium },
        large: { padding: scale.large },
    },
    px: {
        micro: { paddingHorizontal: scale.micro },
        tiny: { paddingHorizontal: scale.tiny },
        small: { paddingHorizontal: scale.small },
        medium: { paddingHorizontal: scale.medium },
        large: { paddingHorizontal: scale.large },
    },
    py: {
        micro: { paddingVertical: scale.micro },
        tiny: { paddingVertical: scale.tiny },
        small: { paddingVertical: scale.small },
        medium: { paddingVertical: scale.medium },
        large: { paddingVertical: scale.large },
    },
};
export const margin = {
    margin: {
        micro: { margin: scale.micro },
        tiny: { margin: scale.tiny },
        small: { margin: scale.small },
        medium: { margin: scale.medium },
        large: { margin: scale.large },
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