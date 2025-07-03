"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnableLogging = exports.DevToolsPluginClient = exports.getDevToolsPluginClientAsync = void 0;
exports.useDevToolsPluginClient = useDevToolsPluginClient;
const react_1 = require("react");
const DevToolsPluginClient_1 = require("./DevToolsPluginClient");
Object.defineProperty(exports, "DevToolsPluginClient", { enumerable: true, get: function () { return DevToolsPluginClient_1.DevToolsPluginClient; } });
const DevToolsPluginClientFactory_1 = require("./DevToolsPluginClientFactory");
Object.defineProperty(exports, "getDevToolsPluginClientAsync", { enumerable: true, get: function () { return DevToolsPluginClientFactory_1.getDevToolsPluginClientAsync; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "setEnableLogging", { enumerable: true, get: function () { return logger_1.setEnableLogging; } });
/**
 * A React hook to get the DevToolsPluginClient instance.
 */
function useDevToolsPluginClient(pluginName, options) {
    const [client, setClient] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function setup() {
            try {
                const client = await (0, DevToolsPluginClientFactory_1.getDevToolsPluginClientAsync)(pluginName, options);
                setClient(client);
            }
            catch (e) {
                setError(new Error('Failed to setup client from useDevToolsPluginClient: ' + e.toString()));
            }
        }
        async function teardown() {
            try {
                await client?.closeAsync();
            }
            catch (e) {
                setError(new Error('Failed to teardown client from useDevToolsPluginClient: ' + e.toString()));
            }
        }
        setup();
        return () => {
            teardown();
        };
    }, [pluginName]);
    if (error != null) {
        throw error;
    }
    return client;
}
//# sourceMappingURL=index.js.map