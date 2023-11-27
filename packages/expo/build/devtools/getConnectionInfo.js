/**
 * Get the dev server address.
 */
export function getConnectionInfo() {
    const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
    const host = window.location.origin.replace(/^https?:\/\//, '');
    return {
        sender: 'browser',
        devServer: devServerQuery || host,
    };
}
//# sourceMappingURL=getConnectionInfo.js.map