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
exports.DevToolsPluginClientImplApp = void 0;
const DevToolsPluginClient_1 = require("./DevToolsPluginClient");
const logger = __importStar(require("./logger"));
/**
 * The DevToolsPluginClient for the app -> browser communication.
 */
class DevToolsPluginClientImplApp extends DevToolsPluginClient_1.DevToolsPluginClient {
    // Map of pluginName -> browserClientId
    browserClientMap = {};
    /**
     * Initialize the connection.
     * @hidden
     */
    async initAsync() {
        await super.initAsync();
        this.addHandshakeHandler();
    }
    addHandshakeHandler() {
        this.addHandskakeMessageListener((params) => {
            if (params.method === 'handshake') {
                const { pluginName, protocolVersion } = params;
                // [0] Check protocol version
                if (protocolVersion !== this.connectionInfo.protocolVersion) {
                    // Use console.warn than logger because we want to show the warning even logging is disabled.
                    console.warn(`Received an incompatible devtools plugin handshake message - pluginName[${pluginName}]`);
                    this.terminateBrowserClient(pluginName, params.browserClientId);
                    return;
                }
                // [1] Terminate duplicated browser clients for the same plugin
                const previousBrowserClientId = this.browserClientMap[pluginName];
                if (previousBrowserClientId != null && previousBrowserClientId !== params.browserClientId) {
                    logger.info(`Terminate the previous browser client connection - previousBrowserClientId[${previousBrowserClientId}]`);
                    this.terminateBrowserClient(pluginName, previousBrowserClientId);
                }
                this.browserClientMap[pluginName] = params.browserClientId;
            }
        });
    }
    terminateBrowserClient(pluginName, browserClientId) {
        this.sendHandshakeMessage({
            protocolVersion: this.connectionInfo.protocolVersion,
            method: 'terminateBrowserClient',
            browserClientId,
            pluginName,
        });
    }
}
exports.DevToolsPluginClientImplApp = DevToolsPluginClientImplApp;
//# sourceMappingURL=DevToolsPluginClientImplApp.js.map