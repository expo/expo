"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginConfig = void 0;
const getPluginConfig = (props, config) => {
    const targetName = getTargetName(props, config);
    return {
        bundleIdentifier: getBundleIdentifier(props, config, targetName),
        targetName,
    };
};
exports.getPluginConfig = getPluginConfig;
const getTargetName = (props, config) => {
    // If name is passed through plugin props use that value
    if (props?.targetName) {
        return sanitizeTargetName(props.targetName);
    }
    // Else try defaulting to `<scheme>brownfield` or `<ios-scheme>brownfield`
    // if either scheme exists and is a single string
    if (config.scheme && typeof config.scheme === 'string') {
        return sanitizeTargetName(`${config.scheme}brownfield`);
    }
    else if (config.ios?.scheme && typeof config.ios.scheme === 'string') {
        return sanitizeTargetName(`${config.ios.scheme}brownfield`);
    }
    // Else default to project slug
    return sanitizeTargetName(`${config.slug}brownfield`);
};
const getBundleIdentifier = (props, config, targetName) => {
    // If bundle identifier is passed through plugin props use that value
    if (props?.bundleIdentifier) {
        return props.bundleIdentifier;
    }
    // Else try defaulting to `ios.bundleIdentifier` replacing last component
    if (config.ios?.bundleIdentifier) {
        const lastDotIndex = config.ios.bundleIdentifier.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            const removingLastComponent = config.ios.bundleIdentifier.substring(0, lastDotIndex);
            return `${removingLastComponent}.${targetName}`;
        }
    }
    // Else default to a placeholder value
    return `com.example.${targetName}`;
};
const sanitizeTargetName = (targetName) => {
    let sanitized = targetName.replace(/[^a-zA-Z0-9]/g, '');
    if (sanitized.match(/^[0-9]/)) {
        sanitized = `App${sanitized}`;
    }
    if (!sanitized) {
        sanitized = 'BrownfieldApp';
    }
    return sanitized;
};
