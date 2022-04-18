"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const ajv_1 = __importDefault(require("ajv"));
const schema = {
    type: 'object',
    properties: {
        android: {
            type: 'object',
            properties: {
                compileSdkVersion: { type: 'integer', nullable: true },
                targetSdkVersion: { type: 'integer', nullable: true },
                buildToolsVersion: { type: 'string', nullable: true },
                kotlinVersion: { type: 'string', nullable: true },
                enableProguardInReleaseBuilds: { type: 'boolean', nullable: true },
                extraProguardRules: { type: 'string', nullable: true },
                packagingOptions: {
                    type: 'object',
                    properties: {
                        pickFirst: { type: 'array', items: { type: 'string' }, nullable: true },
                        exclude: { type: 'array', items: { type: 'string' }, nullable: true },
                        merge: { type: 'array', items: { type: 'string' }, nullable: true },
                        doNotStrip: { type: 'array', items: { type: 'string' }, nullable: true },
                    },
                    nullable: true,
                },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
                useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
            },
            nullable: true,
        },
    },
};
function validateConfig(config) {
    const validate = new ajv_1.default().compile(schema);
    if (!validate(config)) {
        throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
    }
    return config;
}
exports.validateConfig = validateConfig;
