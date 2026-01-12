"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineManifestPlugin = expoInlineManifestPlugin;
const common_1 = require("./common");
const debug = require('debug')('expo:babel:inline-manifest');
// Convert expo value to PWA value
function ensurePWAOrientation(orientation) {
    if (orientation) {
        const webOrientation = orientation.toLowerCase();
        if (webOrientation !== 'default') {
            return webOrientation;
        }
    }
    return undefined;
}
const RESTRICTED_MANIFEST_FIELDS = [
    'androidNavigationBar',
    'androidStatusBar',
    'privacy',
    // Remove iOS and Android.
    'ios',
    'android',
    // Hide internal / build values
    'plugins',
    'hooks', // hooks no longer exists in the typescript type but should still be removed
    '_internal',
    // Remove metro-specific values
    'assetBundlePatterns',
];
function getExpoConstantsManifest(projectRoot) {
    const config = getConfigMemo(projectRoot);
    if (!config)
        return null;
    const manifest = applyWebDefaults(config);
    for (const field of RESTRICTED_MANIFEST_FIELDS) {
        delete manifest[field];
    }
    return manifest;
}
function applyWebDefaults({ config, appName, webName }) {
    const appJSON = config.exp;
    // For RN CLI support
    const { web: webManifest = {}, splash = {}, ios = {}, android = {} } = appJSON;
    const languageISOCode = webManifest.lang;
    const primaryColor = appJSON.primaryColor;
    const description = appJSON.description;
    // The theme_color sets the color of the tool bar, and may be reflected in the app's preview in task switchers.
    const webThemeColor = webManifest.themeColor || primaryColor;
    const dir = webManifest.dir;
    const shortName = webManifest.shortName || webName;
    const display = webManifest.display;
    const startUrl = webManifest.startUrl;
    const { scope, crossorigin } = webManifest;
    const barStyle = webManifest.barStyle;
    const orientation = ensurePWAOrientation(webManifest.orientation || appJSON.orientation);
    /**
     * **Splash screen background color**
     * `https://developers.google.com/web/fundamentals/web-app-manifest/#splash-screen`
     * The background_color should be the same color as the load page,
     * to provide a smooth transition from the splash screen to your app.
     */
    const backgroundColor = webManifest.backgroundColor || splash.backgroundColor; // No default background color
    return {
        ...appJSON,
        name: appName,
        description,
        primaryColor,
        // Ensure these objects exist
        ios: {
            ...ios,
        },
        android: {
            ...android,
        },
        web: {
            ...webManifest,
            meta: undefined,
            build: undefined,
            scope,
            crossorigin,
            description,
            startUrl,
            shortName,
            display,
            orientation,
            dir,
            barStyle,
            backgroundColor,
            themeColor: webThemeColor,
            lang: languageISOCode,
            name: webName,
        },
    };
}
function getExpoAppManifest(projectRoot) {
    if (process.env.APP_MANIFEST) {
        return process.env.APP_MANIFEST;
    }
    const exp = getExpoConstantsManifest(projectRoot);
    if (exp) {
        debug('public manifest', exp);
        return JSON.stringify(exp);
    }
    else {
        debug('public manifest is null. `expo/config` is not available');
        return null;
    }
}
let configMemo;
function getConfigMemo(projectRoot) {
    if (configMemo === undefined) {
        let expoConfig;
        try {
            // This is an optional dependency. In practice, it will resolve in all Expo projects/apps
            // since `expo` is a direct dependency in those. If `babel-preset-expo` is used independently
            // this will fail and we won't return a config
            expoConfig = require('expo/config');
        }
        catch (error) {
            if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
                return (configMemo = null);
            }
            throw error;
        }
        const { getConfig, getNameFromConfig } = expoConfig;
        const config = getConfig(projectRoot, {
            isPublicConfig: true,
            skipSDKVersionRequirement: true,
        });
        // rn-cli apps use a displayName value as well.
        const { appName, webName } = getNameFromConfig(config.exp);
        configMemo = {
            config,
            appName,
            webName,
        };
    }
    return configMemo;
}
// Convert `process.env.APP_MANIFEST` to a modified web-specific variation of the app.json public manifest.
function expoInlineManifestPlugin(api) {
    const { types: t } = api;
    const isReactServer = api.caller(common_1.getIsReactServer);
    const platform = api.caller(common_1.getPlatform);
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot);
    const shouldInline = platform === 'web' || isReactServer;
    // Early exit: return a no-op plugin if we're not going to inline anything
    if (!shouldInline) {
        return {
            name: 'expo-inline-manifest-plugin',
            visitor: {},
        };
    }
    return {
        name: 'expo-inline-manifest-plugin',
        pre() {
            this.projectRoot = possibleProjectRoot || this.file.opts.root || '';
        },
        visitor: {
            MemberExpression(path, state) {
                // We're looking for: process.env.APP_MANIFEST
                // This visitor is called on every MemberExpression, so we need fast checks
                // Quick check: the property we're looking for is 'APP_MANIFEST'
                // The parent must be a MemberExpression with property 'APP_MANIFEST'
                const parent = path.parentPath;
                if (!parent?.isMemberExpression())
                    return;
                // Check if parent's property is APP_MANIFEST (most selective check first)
                const parentProp = parent.node.property;
                if (!t.isIdentifier(parentProp) || parentProp.name !== 'APP_MANIFEST')
                    return;
                // Now verify this is process.env
                const obj = path.node.object;
                const prop = path.node.property;
                if (!t.isIdentifier(obj) || obj.name !== 'process')
                    return;
                if (!t.isIdentifier(prop) || prop.name !== 'env')
                    return;
                // Skip if this is an assignment target
                if (parent.parentPath?.isAssignmentExpression())
                    return;
                // Surfaces the `app.json` (config) as an environment variable which is then parsed by
                // `expo-constants` https://docs.expo.dev/versions/latest/sdk/constants/
                const manifest = getExpoAppManifest(state.projectRoot);
                if (manifest !== null) {
                    parent.replaceWith(t.stringLiteral(manifest));
                }
            },
        },
    };
}
