"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
const schema_utils_1 = require("@expo/schema-utils");
const schema = {
    title: 'expo-dev-launcher',
    type: 'object',
    properties: {
        launchMode: {
            type: 'string',
            enum: ['most-recent', 'launcher'],
            nullable: true,
        },
        launchModeExperimental: {
            type: 'string',
            enum: ['most-recent', 'launcher'],
            nullable: true,
        },
        android: {
            type: 'object',
            properties: {
                launchMode: {
                    type: 'string',
                    enum: ['most-recent', 'launcher'],
                    nullable: true,
                },
                launchModeExperimental: {
                    type: 'string',
                    enum: ['most-recent', 'launcher'],
                    nullable: true,
                },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                launchMode: {
                    type: 'string',
                    enum: ['most-recent', 'launcher'],
                    nullable: true,
                },
                launchModeExperimental: {
                    type: 'string',
                    enum: ['most-recent', 'launcher'],
                    nullable: true,
                },
            },
            nullable: true,
        },
    },
};
/**
 * @ignore
 */
function validateConfig(config) {
    (0, schema_utils_1.validate)(schema, config);
    if (config.launchModeExperimental ||
        config.ios?.launchModeExperimental ||
        config.android?.launchModeExperimental) {
        warnOnce('The `launchModeExperimental` property of expo-dev-launcher config plugin is deprecated and will be removed in a future SDK release. Use `launchMode` instead.');
    }
    return config;
}
const warnMap = {};
function warnOnce(message) {
    if (!warnMap[message]) {
        warnMap[message] = true;
        console.warn(message);
    }
}
