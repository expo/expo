/**
 * Get the dev server address.
 */
import { PROTOCOL_VERSION } from './ProtocolVersion';
export function getConnectionInfo() {
    const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
    const host = window.location.origin.replace(/^https?:\/\//, '');
    return {
        protocolVersion: PROTOCOL_VERSION,
        sender: 'browser',
        devServer: devServerQuery || host,
    };
}
//# sourceMappingURL=getConnectionInfo.js.map