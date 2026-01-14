/**
 * Get the dev server address.
 */
import { PROTOCOL_VERSION } from './ProtocolVersion';
export function getConnectionInfo() {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
    const devServerUrl = getDevServer().url;
    const devServer = devServerUrl.replace(/^https?:\/\//, '').replace(/\/?$/, '');
    return {
        protocolVersion: PROTOCOL_VERSION,
        sender: 'app',
        devServer,
        useWss: devServerUrl.startsWith('https://'),
    };
}
//# sourceMappingURL=getConnectionInfo.native.js.map