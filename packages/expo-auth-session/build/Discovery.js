import invariant from 'invariant';
import { requestAsync } from './Fetch';
/**
 * Append the well known resources path and OpenID connect discovery document path to a URL
 * https://tools.ietf.org/html/rfc5785
 */
export function issuerWithWellKnownUrl(issuer) {
    return `${issuer}/.well-known/openid-configuration`;
}
// @needsAudit
/**
 * Fetch a `DiscoveryDocument` from a well-known resource provider that supports auto discovery.
 * @param issuer An `Issuer` URL to fetch from.
 * @return Returns a discovery document that can be used for authentication.
 */
export async function fetchDiscoveryAsync(issuer) {
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
// @needsAudit
/**
 * Utility method for resolving the discovery document from an issuer or object.
 *
 * @param issuerOrDiscovery
 */
export async function resolveDiscoveryAsync(issuerOrDiscovery) {
    invariant(issuerOrDiscovery && !['number', 'boolean'].includes(typeof issuerOrDiscovery), 'Expected a valid discovery object or issuer URL');
    if (typeof issuerOrDiscovery === 'string') {
        return await fetchDiscoveryAsync(issuerOrDiscovery);
    }
    return issuerOrDiscovery;
}
//# sourceMappingURL=Discovery.js.map