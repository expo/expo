import { lightTheme, darkTheme, shadows } from '@expo/styleguide-native';
import { View as RNView } from 'react-native';
import { create } from './create-primitive';
import { scale, padding, margin, rounded, bg, bgDark, width, height } from './theme';
export const View = create(RNView, {
    variants: {
        overflow: {
            hidden: {
                overflow: 'hidden',
            },
        },
        align: {
            centered: {
                justifyContent: 'center',
                alignItems: 'center',
            },
        },
        flex: {
            '1': { flex: 1 },
            '0': { flex: 0 },
        },
        shrink: {
            '1': { flexShrink: 1 },
            '0': { flexShrink: 0 },
        },
        grow: {
            '1': { flexGrow: 1 },
            '0': { flexGrow: 0 },
        },
        bg,
        border: {
            default: { borderColor: lightTheme.border.default, borderWidth: 1 },
        },
        ...rounded,
        shadow: {
            micro: shadows.micro,
            tiny: shadows.tiny,
            small: shadows.small,
            medium: shadows.medium,
            button: shadows.button,
        },
        width,
        height,
        ...padding,
        ...margin,
    },
    selectors: {
        dark: {
            bg: bgDark,
            border: {
                default: { borderColor: darkTheme.border.default, borderWidth: 1 },
            },
        },
        light: {
            bg: {},
        },
    },
});
export const Row = create(RNView, {
    base: {
        flexDirection: 'row',
    },
    variants: {
        bg,
        align: {
            center: { alignItems: 'center' },
            start: { alignItems: 'flex-start' },
            end: { alignItems: 'flex-end' },
        },
        ...padding,
        ...margin,
    },
    selectors: {
        dark: {
            bg: bgDark,
        },
    },
});
const Horizontal = create(RNView, {
    base: {
        flex: 1,
    },
    variants: {
        size: {
            micro: { width: scale.micro, flex: 0 },
            tiny: { width: scale.tiny, flex: 0 },
            small: { width: scale.small, flex: 0 },
            medium: { width: scale.medium, flex: 0 },
            large: { width: scale.large, flex: 0 },
            xl: { width: scale.xl, flex: 0 },
        },
    },
});
const Vertical = create(RNView, {
    base: {
        flex: 1,
    },
    variants: {
        size: {
            micro: { height: scale.micro, flex: 0 },
            tiny: { height: scale.tiny, flex: 0 },
            small: { height: scale.small, flex: 0 },
            medium: { height: scale.medium, flex: 0 },
            large: { height: scale.large, flex: 0 },
            xl: { height: scale.xl, flex: 0 },
        },
    },
});
export const Spacer = {
    Vertical,
    Horizontal,
};
export const Divider = create(RNView, {
    base: {
        borderWidth: 0.5,
        borderColor: lightTheme.border.default,
    },
    variants: {
        weight: {
            thin: { borderWidth: 0.5 },
            normal: { borderWidth: 1 },
            heavy: { borderWidth: 2 },
        },
        ...margin,
    },
    selectors: {
        dark: {
            borderColor: darkTheme.border.default,
        },
    },
});
export const StatusIndicator = create(RNView, {
    base: {
        backgroundColor: lightTheme.status.default,
        borderRadius: 9999,
    },
    variants: {
        status: {
            info: { backgroundColor: lightTheme.status.info },
            success: { backgroundColor: lightTheme.status.success },
            warning: { backgroundColor: lightTheme.status.warning },
            error: { backgroundColor: lightTheme.status.error },
            default: { backgroundColor: lightTheme.status.default },
        },
        size: {
            small: {
                width: scale.small,
                height: scale.small,
            },
            medium: {
                width: scale.medium,
                height: scale.medium,
            },
        },
    },
    selectors: {
        dark: {
            info: { backgroundColor: darkTheme.status.info },
            success: { backgroundColor: darkTheme.status.success },
            warning: { backgroundColor: darkTheme.status.warning },
            error: { backgroundColor: darkTheme.status.error },
            default: { backgroundColor: darkTheme.status.default },
        },
    },
});
//# sourceMappingURL=View.js.map