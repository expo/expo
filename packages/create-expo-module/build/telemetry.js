"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCreateExpoModule = exports.logEventAsync = exports.getTelemetryClient = void 0;
const getUserState_1 = require("@expo/config/build/getUserState");
const json_file_1 = __importDefault(require("@expo/json-file"));
const rudder_sdk_node_1 = __importDefault(require("@expo/rudder-sdk-node"));
const crypto_1 = __importDefault(require("crypto"));
const getenv_1 = require("getenv");
const os_1 = __importDefault(require("os"));
const packageJson = require('../package.json');
/** If telemetry is disabled by the user */
const EXPO_NO_TELEMETRY = (0, getenv_1.boolish)('EXPO_NO_TELEMETRY', false);
/** If the tool is running in a sanboxed environment, either staging or local envs */
const EXPO_SANDBOX = (0, getenv_1.boolish)('EXPO_STAGING', false) || (0, getenv_1.boolish)('EXPO_LOCAL', false);
/** The telemetry client instance to use */
let client = null;
/** The anonymous identity ID */
let telemetryId = null;
function getTelemetryClient() {
    if (!client) {
        client = new rudder_sdk_node_1.default(EXPO_SANDBOX ? '24TKICqYKilXM480mA7ktgVDdea' : '24TKR7CQAaGgIrLTgu3Fp4OdOkI', // expo unified,
        'https://cdp.expo.dev/v1/batch', {
            flushInterval: 300,
        });
        // Empty the telemetry queue on exit
        process.on('SIGINT', () => client?.flush?.());
        process.on('SIGTERM', () => client?.flush?.());
    }
    return client;
}
exports.getTelemetryClient = getTelemetryClient;
/** Get the randomly generated anonymous ID from the persistent storage, see @expo/cli */
async function getTelemetryIdAsync() {
    const settings = new json_file_1.default((0, getUserState_1.getUserStatePath)(), {
        ensureDir: true,
        jsonParseErrorDefault: {},
        cantReadFileDefault: {},
    });
    let id = await settings.getAsync('uuid', null);
    if (!id) {
        id = crypto_1.default.randomUUID();
        await settings.setAsync('uuid', id);
    }
    return id;
}
function getTelemetryContext() {
    const PLATFORM_NAMES = {
        darwin: 'Mac',
        win32: 'Windows',
        linux: 'Linux',
    };
    return {
        os: { name: PLATFORM_NAMES[os_1.default.platform()] ?? os_1.default.platform(), version: os_1.default.release() },
        app: { name: 'create-expo-module', version: packageJson.version ?? undefined },
    };
}
async function logEventAsync(event) {
    if (EXPO_NO_TELEMETRY) {
        return;
    }
    if (!telemetryId) {
        telemetryId = await getTelemetryIdAsync();
        getTelemetryClient().identify({ anonymousId: telemetryId });
    }
    const commonProperties = {
        source: 'create-expo-module',
        source_version: packageJson.version ?? undefined,
    };
    getTelemetryClient().track({
        ...event,
        properties: { ...event.properties, ...commonProperties },
        anonymousId: telemetryId,
        context: getTelemetryContext(),
    });
}
exports.logEventAsync = logEventAsync;
function eventCreateExpoModule(packageManager, options) {
    return {
        event: 'create expo module', // DO NOT EDIT, unless knowing what you are doing
        properties: {
            nodeVersion: process.version,
            packageManager,
            withTemplate: !!options.source,
            withReadme: options.withReadme,
            withChangelog: options.withChangelog,
            withExample: options.example,
            local: !!options.local,
        },
    };
}
exports.eventCreateExpoModule = eventCreateExpoModule;
//# sourceMappingURL=telemetry.js.map