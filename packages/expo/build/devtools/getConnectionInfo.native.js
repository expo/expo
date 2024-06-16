/**
 * Get the dev server address.
 */
export function getConnectionInfo() {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer');
    const devServer = getDevServer()
        .url.replace(/^https?:\/\//, '')
        .replace(/\/?$/, '');
    return {
        sender: 'app',
        devServer,
    };
}
//# sourceMappingURL=getConnectionInfo.native.js.map