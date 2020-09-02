import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Platform } from 'react-native';
export function applyRequiredScopes(scopes = [], requiredScopes) {
    // Add the required scopes for returning profile data.
    // Remove duplicates
    return [...new Set([...scopes, ...requiredScopes])];
}
// Only natively in the Expo client.
export function shouldUseProxy() {
    return Platform.select({
        web: false,
        // Use the proxy in the Expo client.
        default: !!Constants.manifest && Constants.appOwnership !== 'standalone',
    });
}
export function invariantClientId(idName, value, providerName) {
    if (typeof value === 'undefined')
        // TODO(Bacon): Add learn more
        throw new Error(`Client Id property \`${idName}\` must be defined to use ${providerName} auth on this platform.`);
}
export function useProxyEnabled(redirectUriOptions) {
    return useMemo(() => redirectUriOptions.useProxy ?? shouldUseProxy(), [
        redirectUriOptions.useProxy,
    ]);
}
//# sourceMappingURL=ProviderUtils.js.map