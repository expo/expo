"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePlatformTheme = usePlatformTheme;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const _1 = require("./");
function usePlatformTheme() {
    const scheme = (0, react_native_1.useColorScheme)();
    return (0, react_1.useMemo)(() => react_native_1.Platform.select({
        ios: {
            dark: scheme === 'dark',
            fonts: native_1.DarkTheme.fonts,
            colors: {
                primary: _1.Color.ios.systemBlue,
                background: _1.Color.ios.systemBackground,
                card: _1.Color.ios.systemGray6,
                text: _1.Color.ios.label,
                border: _1.Color.ios.separator,
                notification: _1.Color.ios.systemRed,
            },
        },
        android: {
            dark: scheme === 'dark',
            fonts: native_1.DarkTheme.fonts,
            colors: {
                primary: _1.Color.android.dynamic.primary,
                background: _1.Color.android.dynamic.surface,
                card: _1.Color.android.dynamic.surfaceContainer,
                text: _1.Color.android.dynamic.onSurface,
                border: _1.Color.android.dynamic.outline,
                notification: _1.Color.android.dynamic.error,
            },
        },
        default: scheme === 'dark' ? native_1.DarkTheme : native_1.DefaultTheme,
    }), [scheme]);
}
//# sourceMappingURL=theme.js.map