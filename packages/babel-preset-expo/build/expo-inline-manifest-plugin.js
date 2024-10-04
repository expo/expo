"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoInlineManifestPlugin = void 0;
const config_1 = require("expo/config");
const common_1 = require("./common");
const debug = require('debug')('expo:babel:inline-manifest');
// Convert expo value to PWA value
function ensurePWAorientation(orientation) {
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
    'hooks',
    '_internal',
    // Remove metro-specific values
    'assetBundlePatterns',
];
function getExpoConstantsManifest(projectRoot) {
    const { exp } = getConfigMemo(projectRoot);
    const manifest = applyWebDefaults(exp);
    for (const field of RESTRICTED_MANIFEST_FIELDS) {
        delete manifest[field];
    }
    return manifest;
}
function applyWebDefaults(appJSON) {
    // For RN CLI support
    const { web: webManifest = {}, splash = {}, ios = {}, android = {} } = appJSON;
    // rn-cli apps use a displayName value as well.
    const { appName, webName } = (0, config_1.getNameFromConfig)(appJSON);
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
    const orientation = ensurePWAorientation(webManifest.orientation || appJSON.orientation);
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
    debug('public manifest', exp);
    return JSON.stringify(exp);
}
let config;
function getConfigMemo(projectRoot) {
    if (!config) {
        config = (0, config_1.getConfig)(projectRoot, {
            isPublicConfig: true,
            skipSDKVersionRequirement: true,
        });
    }
    return config;
}
// Convert `process.env.APP_MANIFEST` to a modified web-specific variation of the app.json public manifest.
function expoInlineManifestPlugin(api) {
    const { types: t } = api;
    const platform = api.caller(common_1.getPlatform);
    const possibleProjectRoot = api.caller(common_1.getPossibleProjectRoot);
    return {
        name: 'expo-inline-manifest-plugin',
        visitor: {
            MemberExpression(path, state) {
                // Web-only feature, the native manifest is provided dynamically by the client.
                if (platform !== 'web') {
                    return;
                }
                if (!t.isIdentifier(path.node.object, { name: 'process' }) ||
                    !t.isIdentifier(path.node.property, { name: 'env' })) {
                    return;
                }
                const parent = path.parentPath;
                if (!t.isMemberExpression(parent.node)) {
                    return;
                }
                const projectRoot = possibleProjectRoot || state.file.opts.root || '';
                if (
                // Surfaces the `app.json` (config) as an environment variable which is then parsed by
                // `expo-constants` https://docs.expo.dev/versions/latest/sdk/constants/
                t.isIdentifier(parent.node.property, {
                    name: 'APP_MANIFEST',
                }) &&
                    !parent.parentPath.isAssignmentExpression()) {
                    const manifest = getExpoAppManifest(projectRoot);
                    parent.replaceWith(t.stringLiteral(manifest));
                }
            },
        },
    };
}
exports.expoInlineManifestPlugin = expoInlineManifestPlugin;
