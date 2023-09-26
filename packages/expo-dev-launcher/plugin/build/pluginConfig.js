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
        tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
        android: {
            type: 'object',
            properties: {
                tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
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
    return config;
}
exports.validateConfig = validateConfig;
