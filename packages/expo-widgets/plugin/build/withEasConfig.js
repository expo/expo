"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withEasConfig = (config, { targetName, bundleIdentifier, groupIdentifier }) => {
    let configIndex = null;
    config.extra?.eas?.build?.experimental?.ios?.appExtensions?.forEach((ext, index) => {
        if (ext.targetName === targetName) {
            configIndex = index;
        }
    });
    if (configIndex === null) {
        config.extra = {
            ...config.extra,
            eas: {
                ...config.extra?.eas,
                build: {
                    ...config.extra?.eas?.build,
                    experimental: {
                        ...config.extra?.eas?.build?.experimental,
                        ios: {
                            ...config.extra?.eas?.build?.experimental?.ios,
                            appExtensions: [
                                ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []),
                                {
                                    targetName,
                                    bundleIdentifier,
                                    entitlements: {
                                        'com.apple.security.application-groups': [groupIdentifier],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        };
    }
    else if (config.extra) {
        // Ensure the entitlements are up to date for an existing entry
        const existingEntry = config.extra.eas.build.experimental.ios.appExtensions[configIndex];
        const existingGroups = existingEntry.entitlements?.['com.apple.security.application-groups'] ?? [];
        if (!existingGroups.includes(groupIdentifier)) {
            existingEntry.entitlements = {
                ...existingEntry.entitlements,
                'com.apple.security.application-groups': [groupIdentifier, ...existingGroups],
            };
        }
    }
    return config;
};
exports.default = withEasConfig;
