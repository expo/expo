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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDevToolsPluginListenerAsync = void 0;
const Application = __importStar(require("expo-application"));
const DeviceInfo = __importStar(require("expo-device"));
const expo_modules_core_1 = require("expo-modules-core");
const DevToolsPluginClientFactory_1 = require("../devtools/DevToolsPluginClientFactory");
/**
 * Starts a new imperative listener for cli plugins. This is an alternative to the useDevToolsPlugin
 * hook that is used with devtools. This function is used to avoid having the user to use the hook,
 * and to be able to imperatively communicate over the web socket connections with running apps.
 * We should not run these if we are in production - but we should run in development
 * and when in a development client built in release mode with EAS. This is tested using the
 * ´globalThis.expo.modules.EXDevLauncher !== undefined´ expression.
 * @returns
 */
const startDevToolsPluginListenerAsync = async (pluginName) => {
    // Only include this code if we are in a development environment.
    if (
    // iOS and Android has differeent class names for the dev launcher module.
    globalThis.expo.modules.ExpoDevLauncherInternal !== undefined ||
        globalThis.expo.modules.EXDevLauncher !== undefined) {
        console.debug(`Starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
        let clientRef = null;
        const listenerRemovals = [];
        const getDeviceName = () => {
            return expo_modules_core_1.Platform.OS === 'android'
                ? DeviceInfo.deviceName +
                    ' - ' +
                    DeviceInfo.osVersion +
                    ' - API ' +
                    DeviceInfo.platformApiLevel
                : DeviceInfo.deviceName;
        };
        const client = await (0, DevToolsPluginClientFactory_1.getDevToolsPluginClientAsync)(pluginName);
        if (clientRef != null) {
            // Clean up the previous client if it exists
            listenerRemovals.forEach((cleanup) => cleanup());
            listenerRemovals.length = 0;
        }
        clientRef = client;
        // Ensure the module is properly cleaned up
        // @ts-ignore
        const m = module;
        if ('hot' in m && m.hot) {
            const hot = m.hot;
            if ('dispose' in hot && hot.dispose && hot.dispose instanceof Function) {
                hot.dispose(() => {
                    // Clean up here
                    listenerRemovals.forEach((remove) => remove());
                    listenerRemovals.length = 0;
                });
            }
        }
        // Create the addMessageListener function for the plugin
        const addMessageListener = (eventName, callback) => {
            listenerRemovals.push(client.addMessageListener(eventName, async (params) => {
                // Create response message function
                const sendResponseAsync = async (message) => {
                    await sendMessageAsync(eventName + '_response', message);
                };
                callback({ params, sendResponseAsync });
            }).remove);
        };
        // Create the sendMessageAsync function for the plugin
        const sendMessageAsync = async (eventName, message) => {
            await client.sendMessage(eventName, {
                message,
                deviceName: getDeviceName(),
                applicationId: Application.applicationId,
            });
        };
        return { addMessageListener, sendMessageAsync };
    }
    else {
        console.debug(`Skipping starting startDevToolsPluginListenerAsync for plugin ${pluginName}...`);
        const addMessageListener = (_e, _c) => { };
        // Create the sendMessageAsync function for the plugin
        const sendMessageAsync = async (_e, _m) => { };
        return { addMessageListener, sendMessageAsync };
    }
};
exports.startDevToolsPluginListenerAsync = startDevToolsPluginListenerAsync;
//# sourceMappingURL=messages.native.js.map