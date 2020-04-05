import invariant from 'invariant';
import { requestAsync } from './Fetch';
/**
 * Append the well known resources path and OpenID connect discovery document path to a URL
 * https://tools.ietf.org/html/rfc5785
 */
export function issuerWithWellKnownUrl(issuer) {
    return `${issuer}/.well-known/openid-configuration`;
}
export async function fetchProviderConfigAsync(issuer) {
    const json = await requestAsync(issuerWithWellKnownUrl(issuer), {
        dataType: 'json',
        method: 'GET',
    });
    return {
        discoveryDocument: json,
        authorizationEndpoint: json.authorization_endpoint,
        tokenEndpoint: json.token_endpoint,
        revocationEndpoint: json.revocation_endpoint,
        userInfoEndpoint: json.userinfo_endpoint,
        endSessionEndpoint: json.end_session_endpoint,
        registrationEndpoint: json.registration_endpoint,
    };
}
/**
 * Utility method for resolving the provider config from an issuer or object.
 *
 * @param issuerOrProviderConfig
 */
export async function resolveProviderConfigAsync(issuerOrProviderConfig) {
    invariant(issuerOrProviderConfig && !['number', 'boolean'].includes(typeof issuerOrProviderConfig), 'Expected a valid Provider configuration or issuer URL');
    if (typeof issuerOrProviderConfig === 'string') {
        return await fetchProviderConfigAsync(issuerOrProviderConfig);
    }
    return issuerOrProviderConfig;
}
//# sourceMappingURL=ProviderConfig.js.map