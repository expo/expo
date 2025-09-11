/**
 * Get the dev server address.
 */
import { PROTOCOL_VERSION } from './ProtocolVersion';
export function getConnectionInfo() {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    const devServer = getDevServer()
        .url.replace(/^https?:\/\//, '')
        .replace(/\/?$/, '');
    return {
        protocolVersion: PROTOCOL_VERSION,
        sender: 'app',
        devServer,
    };
}
//# sourceMappingURL=getConnectionInfo.native.js.map