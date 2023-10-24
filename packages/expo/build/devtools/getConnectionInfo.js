/**
 * Get the dev server address.
 */
export function getConnectionInfo() {
    return {
        sender: 'browser',
        devServer: window.location.origin.replace(/^https?:\/\//, ''),
    };
}
//# sourceMappingURL=getConnectionInfo.js.map