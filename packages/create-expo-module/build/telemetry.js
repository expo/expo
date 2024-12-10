"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCreateExpoModule = exports.logEventAsync = exports.getTelemetryClient = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const rudder_sdk_node_1 = __importDefault(require("@expo/rudder-sdk-node"));
const crypto_1 = __importDefault(require("crypto"));
const getenv_1 = require("getenv");
const os_1 = __importStar(require("os"));
const path = __importStar(require("path"));
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
// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
function getExpoHomeDirectory() {
    const home = (0, os_1.homedir)();
    if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
        return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    }
    else if ((0, getenv_1.boolish)('EXPO_STAGING', false)) {
        return path.join(home, '.expo-staging');
    }
    else if ((0, getenv_1.boolish)('EXPO_LOCAL', false)) {
        return path.join(home, '.expo-local');
    }
    return path.join(home, '.expo');
}
function getUserStatePath() {
    return path.join(getExpoHomeDirectory(), 'state.json');
}
/** Get the randomly generated anonymous ID from the persistent storage, see @expo/cli */
async function getTelemetryIdAsync() {
    const settings = new json_file_1.default(getUserStatePath(), {
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
        event: 'create expo module',
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