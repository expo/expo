"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLegacyPlugin = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const toCamelCase = (s) => s.replace(/-./g, (x) => x.toUpperCase()[1]);
function isModuleExcluded(config, packageName) {
    // Skip using the versioned plugin when autolinking is enabled
    // and doesn't link the native module.
    return (config._internal?.autolinkedModules && !config._internal.autolinkedModules.includes(packageName));
}
function createLegacyPlugin({ packageName, fallback, }) {
    let withFallback;
    if (Array.isArray(fallback)) {
        withFallback = (config) => (0, config_plugins_1.withPlugins)(config, fallback);
    }
    else {
        withFallback = fallback;
    }
    const withUnknown = (config) => {
        // Skip using the versioned plugin when autolinking is enabled
        // and doesn't link the native module.
        if (isModuleExcluded(config, packageName)) {
            return (0, config_plugins_1.createRunOncePlugin)(withFallback, packageName)(config);
        }
        return (0, config_plugins_1.withStaticPlugin)(config, {
            _isLegacyPlugin: true,
            plugin: packageName,
            // If the static plugin isn't found, use the unversioned one.
            fallback: (0, config_plugins_1.createRunOncePlugin)(withFallback, packageName),
        });
    };
    const methodName = toCamelCase(`with-${packageName}`);
    Object.defineProperty(withUnknown, 'name', {
        value: methodName,
    });
    return withUnknown;
}
exports.createLegacyPlugin = createLegacyPlugin;
