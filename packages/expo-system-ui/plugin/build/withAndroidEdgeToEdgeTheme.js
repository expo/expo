"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidEdgeToEdgeTheme = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withAndroidEdgeToEdgeTheme = (config) => {
    return (0, config_plugins_1.withAndroidStyles)(config, (config) => {
        const { experiments = {}, userInterfaceStyle = 'automatic' } = config;
        const { edgeToEdge = false } = experiments;
        config.modResults.resources.style = config.modResults.resources.style?.map((style) => {
            if (style.$.name === 'AppTheme') {
                style.$.parent = edgeToEdge ? 'Theme.EdgeToEdge' : 'Theme.AppCompat.Light.NoActionBar';
                style.item = (style.item ?? []).filter((item) => {
                    if (item.$.name === 'windowLightSystemBars') {
                        return false;
                    }
                    if (!edgeToEdge) {
                        return true;
                    }
                    return (item.$.name !== 'android:statusBarColor' &&
                        item.$.name !== 'android:windowLightStatusBar' &&
                        item.$.name !== 'android:navigationBarColor' &&
                        item.$.name !== 'android:windowLightNavigationBar');
                });
                if (edgeToEdge && userInterfaceStyle !== 'automatic') {
                    style.item.push({
                        $: { name: 'windowLightSystemBars' },
                        _: String(userInterfaceStyle === 'light'),
                    });
                }
            }
            return style;
        });
        return config;
    });
};
exports.withAndroidEdgeToEdgeTheme = withAndroidEdgeToEdgeTheme;
