export function applyRequiredScopes(scopes = [], requiredScopes) {
    // Add the required scopes for returning profile data.
    // Remove duplicates
    return [...new Set([...scopes, ...requiredScopes])];
}
export function invariantClientId(idName, value, providerName) {
    if (typeof value === 'undefined')
        // TODO(Bacon): Add learn more
        throw new Error(`Client Id property \`${idName}\` must be defined to use ${providerName} auth on this platform.`);
}
//# sourceMappingURL=ProviderUtils.js.map