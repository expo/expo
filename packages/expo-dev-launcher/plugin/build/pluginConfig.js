"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
const ajv_1 = __importDefault(require("ajv"));
const schema = {
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
    const validate = new ajv_1.default({ allowUnionTypes: true }).compile(schema);
    if (!validate(config)) {
        throw new Error('Invalid expo-dev-launcher config: ' + JSON.stringify(validate.errors));
    }
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
