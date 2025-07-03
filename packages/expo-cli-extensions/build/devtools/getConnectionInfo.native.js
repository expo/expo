"use strict";
/**
 * Get the dev server address.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionInfo = getConnectionInfo;
const ProtocolVersion_1 = require("./ProtocolVersion");
function getConnectionInfo() {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    const devServer = getDevServer()
        .url.replace(/^https?:\/\//, '')
        .replace(/\/?$/, '');
    return {
        protocolVersion: ProtocolVersion_1.PROTOCOL_VERSION,
        sender: 'app',
        devServer,
    };
}
//# sourceMappingURL=getConnectionInfo.native.js.map