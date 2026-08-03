"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const common_1 = require("../../common");
const withGradlePropertiesPlugin = (config) => {
    return (0, config_plugins_1.withGradleProperties)(config, (config) => {
        if ((0, common_1.checkPlugin)(config, 'expo-dev-menu')) {
            const devMenuReleaseConfiguration = getDevMenuReleaseConfiguration();
            const hasDevMenuConfig = config.modResults.some((item) => item.type === 'property' && item.key === 'expo.devmenu.configureInRelease');
            if (!hasDevMenuConfig) {
                config.modResults = [...config.modResults, ...devMenuReleaseConfiguration];
            }
        }
        // Opt into AGP's Fused Library Preview. The `.publicationOnly=false` flag lets
        // `include(project(...))` resolve sibling subprojects directly (no mavenLocal
        // round-trip). No-op in non-fused mode.
        const hasFusedOptIn = config.modResults.some((item) => item.type === 'property' && item.key === 'android.experimental.fusedLibrarySupport');
        const hasFusedPubFlag = config.modResults.some((item) => item.type === 'property' &&
            item.key === 'android.experimental.fusedLibrarySupport.publicationOnly');
        if (!hasFusedOptIn || !hasFusedPubFlag) {
            config.modResults = [
                ...config.modResults,
                ...getFusedLibrarySupportConfiguration(hasFusedOptIn, hasFusedPubFlag),
            ];
        }
        return config;
    });
};
const getFusedLibrarySupportConfiguration = (hasFusedOptIn, hasFusedPubFlag) => {
    const items = [];
    if (!hasFusedOptIn) {
        items.push({
            type: 'comment',
            value: 'Acknowledge AGP Fused Library Preview status (required to apply the plugin)',
        }, {
            type: 'property',
            key: 'android.experimental.fusedLibrarySupport',
            value: 'true',
        });
    }
    if (!hasFusedPubFlag) {
        items.push({
            type: 'comment',
            value: 'Allow `com.android.fused-library` to include sibling project deps directly',
        }, {
            type: 'property',
            key: 'android.experimental.fusedLibrarySupport.publicationOnly',
            value: 'false',
        });
    }
    return items;
};
const getDevMenuReleaseConfiguration = () => {
    return [
        {
            type: 'comment',
            value: 'Enables expo-dev-menu in release builds',
        },
        {
            type: 'comment',
            value: 'This enables compilation of `Release` and `All` variants in brownfield setup',
        },
        {
            type: 'property',
            key: 'expo.devmenu.configureInRelease',
            value: 'true',
        },
    ];
};
exports.default = withGradlePropertiesPlugin;
