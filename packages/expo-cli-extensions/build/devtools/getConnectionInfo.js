"use strict";
/**
 * Get the dev server address.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionInfo = getConnectionInfo;
const ProtocolVersion_1 = require("./ProtocolVersion");
function getConnectionInfo() {
    const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
    const host = window.location.origin.replace(/^https?:\/\//, '');
    return {
        protocolVersion: ProtocolVersion_1.PROTOCOL_VERSION,
        sender: 'browser',
        devServer: devServerQuery || host,
    };
}
//# sourceMappingURL=getConnectionInfo.js.map