"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SERVER_URL_KEY = void 0;
exports.resolveDefaultServerUrl = resolveDefaultServerUrl;
exports.setDefaultServerUrlInfoPlist = setDefaultServerUrlInfoPlist;
exports.setDefaultServerUrlAndroidManifest = setDefaultServerUrlAndroidManifest;
const config_plugins_1 = require("expo/config-plugins");
const pluginConfig_1 = require("./pluginConfig");
const pkg = require('expo-dev-launcher/package.json');
/**
 * Resolves the development server URL to bake into the build for the given platform.
 *
 * Precedence (highest first):
 * 1. `EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL` env var (build-time override)
 * 2. platform-specific `ios.defaultServerUrl` / `android.defaultServerUrl`
 * 3. top-level `defaultServerUrl`
 *
 * @ignore
 */
function resolveDefaultServerUrl(props, platform, env = process.env) {
    return (env.EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL ??
        props[platform]?.defaultServerUrl ??
        props.defaultServerUrl);
}
/** The Info.plist key / AndroidManifest meta-data name the native launcher reads on startup. */
exports.DEFAULT_SERVER_URL_KEY = 'DEV_CLIENT_DEFAULT_SERVER_URL';
/**
 * Writes the default server URL into the Info.plist so the iOS dev launcher can auto-connect on launch.
 * @ignore
 */
function setDefaultServerUrlInfoPlist(infoPlist, url) {
    infoPlist[exports.DEFAULT_SERVER_URL_KEY] = url;
    return infoPlist;
}
/**
 * Writes the default server URL as main-application meta-data so the Android dev launcher can
 * auto-connect on launch. Idempotent — re-applying replaces the existing value rather than duplicating it.
 * @ignore
 */
function setDefaultServerUrlAndroidManifest(androidManifest, url) {
    const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
    config_plugins_1.AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, exports.DEFAULT_SERVER_URL_KEY, url);
    return androidManifest;
}
/**
 * Adds a build phase script that strips dev-launcher-specific local network permission keys
 * from non-Debug builds. This keeps the keys in Debug builds (where dev-launcher is active)
 * but removes only the dev-launcher entries from production builds.
 *
 * IMPORTANT: This script only removes _expo._tcp Bonjour services and the dev-launcher
 * usage description. Any other Bonjour services or custom local network descriptions
 * added by the app will be preserved in production builds.
 */
const withStripLocalNetworkKeysForRelease = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const project = config.modResults;
        const targetName = config.modRequest.projectName;
        const nativeTargetId = project.findTargetKey(targetName ?? '');
        if (!nativeTargetId) {
            console.warn(`[Expo Dev Launcher] Could not find target "${targetName}" to add build phase script`);
            return config;
        }
        const buildPhaseName = '[Expo Dev Launcher] Strip Local Network Keys for Release';
        const buildPhases = project.pbxNativeTargetSection()[nativeTargetId]?.buildPhases ?? [];
        const existingPhase = buildPhases.find((phase) => {
            return phase.comment === buildPhaseName;
        });
        if (existingPhase) {
            return config;
        }
        project.addBuildPhase([], 'PBXShellScriptBuildPhase', buildPhaseName, nativeTargetId, {
            shellPath: '/bin/sh',
            shellScript: `# Strip dev-launcher-specific local network permission keys from non-Debug builds
# This only removes _expo._tcp Bonjour services and the dev-launcher usage description.
# Other Bonjour services and custom descriptions are preserved for production use.

if [ "$CONFIGURATION" != "Debug" ]; then
  PLIST_PATH="\${TARGET_BUILD_DIR}/\${INFOPLIST_PATH}"
  if [ -f "$PLIST_PATH" ]; then
    # Check if NSBonjourServices exists
    if /usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" >/dev/null 2>&1; then
      # Get the count of services
      COUNT=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" 2>/dev/null | grep "^    " | wc -l | tr -d ' ')

      # Remove _expo._tcp
      for ((i=COUNT-1; i>=0; i--)); do
        SERVICE=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices:$i" "$PLIST_PATH" 2>/dev/null || echo "")
        if echo "$SERVICE" | grep -q "_expo._tcp"; then
          /usr/libexec/PlistBuddy -c "Delete :NSBonjourServices:$i" "$PLIST_PATH" 2>/dev/null || true
        fi
      done

      # If the array is now empty, remove it entirely
      REMAINING=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" 2>/dev/null | grep "^    " | wc -l | tr -d ' ')
      if [ "$REMAINING" -eq "0" ]; then
        /usr/libexec/PlistBuddy -c "Delete :NSBonjourServices" "$PLIST_PATH" 2>/dev/null || true
      fi
    fi

    # Only delete the description if it matches the dev-launcher default text
    DESC=$(/usr/libexec/PlistBuddy -c "Print :NSLocalNetworkUsageDescription" "$PLIST_PATH" 2>/dev/null || echo "")
    if echo "$DESC" | grep -q "Expo Dev Launcher"; then
      /usr/libexec/PlistBuddy -c "Delete :NSLocalNetworkUsageDescription" "$PLIST_PATH" 2>/dev/null || true
    fi
  fi
fi
`,
        });
        return config;
    });
};
/**
 * Adds the required Info.plist keys for local network permission.
 * Only adds _expo._tcp to the Bonjour services array and sets the usage description
 * if one doesn't already exist (preserving custom descriptions).
 */
const withLocalNetworkPermission = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const bonjourServices = config.modResults.NSBonjourServices ?? [];
        const hasExpoService = bonjourServices.some((service) => service.toLowerCase().replace(/\.$/, '') === '_expo._tcp');
        if (!hasExpoService) {
            bonjourServices.push('_expo._tcp');
        }
        config.modResults.NSBonjourServices = bonjourServices;
        if (!config.modResults.NSLocalNetworkUsageDescription) {
            config.modResults.NSLocalNetworkUsageDescription =
                'Expo Dev Launcher uses the local network to discover and connect to development servers running on your computer.';
        }
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)((config, props = {}) => {
    (0, pluginConfig_1.validateConfig)(props);
    const iOSLaunchMode = props.ios?.launchMode ??
        props.launchMode ??
        props.ios?.launchModeExperimental ??
        props.launchModeExperimental;
    if (iOSLaunchMode === 'launcher') {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            config.modResults['DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE'] = false;
            return config;
        });
    }
    const androidLaunchMode = props.android?.launchMode ??
        props.launchMode ??
        props.android?.launchModeExperimental ??
        props.launchModeExperimental;
    if (androidLaunchMode === 'launcher') {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
            config_plugins_1.AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE', false?.toString());
            return config;
        });
    }
    // A default development server URL baked into the build so headless/CI/multi-server setups can
    // auto-connect on launch without scanning a QR code. The `EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL`
    // env var, when set, takes precedence so it can be overridden per build invocation.
    const iOSDefaultServerUrl = resolveDefaultServerUrl(props, 'ios');
    if (iOSDefaultServerUrl) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            config.modResults = setDefaultServerUrlInfoPlist(config.modResults, iOSDefaultServerUrl);
            return config;
        });
    }
    const androidDefaultServerUrl = resolveDefaultServerUrl(props, 'android');
    if (androidDefaultServerUrl) {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            config.modResults = setDefaultServerUrlAndroidManifest(config.modResults, androidDefaultServerUrl);
            return config;
        });
    }
    config = withLocalNetworkPermission(config);
    config = withStripLocalNetworkKeysForRelease(config);
    return config;
}, pkg.name, pkg.version);
