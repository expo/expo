import { UnavailabilityError } from 'expo-errors';
import invariant from 'invariant';
import ExpoAppAuth from './ExpoAppAuth';
const isValidString = (s) => !!(s && typeof s === 'string');
function isValidClientId(clientId) {
    if (!isValidString(clientId))
        throw new Error('Config error: clientId must be a string');
}
function isValidProps({ issuer, redirectUrl, clientId, serviceConfiguration }) {
    const _serviceConfigIsValid = serviceConfiguration &&
        isValidString(serviceConfiguration.authorizationEndpoint) &&
        isValidString(serviceConfiguration.tokenEndpoint);
    if (!isValidString(issuer) && !_serviceConfigIsValid)
        throw new Error('Invalid you must provide either an issuer or a service endpoints');
    if (!isValidString(redirectUrl))
        throw new Error('Config error: redirectUrl must be a string');
    isValidClientId(clientId);
}
async function _executeAsync(props) {
    if (!props.redirectUrl) {
        props.redirectUrl = `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
    }
    isValidProps(props);
    return await ExpoAppAuth.executeAsync(props);
}
export async function authAsync(props) {
    if (!ExpoAppAuth.executeAsync) {
        throw new UnavailabilityError('expo-app-auth', 'authAsync');
    }
    return await _executeAsync(props);
}
export async function refreshAsync(props, refreshToken) {
    if (!ExpoAppAuth.executeAsync) {
        throw new UnavailabilityError('expo-app-auth', 'refreshAsync');
    }
    if (!refreshToken) {
        throw new Error('Please include the refreshToken');
    }
    return await _executeAsync({
        isRefresh: true,
        refreshToken,
        ...props,
    });
}
/* JS Method */
export async function revokeAsync({ clientId, issuer, serviceConfiguration }, { token, isClientIdProvided = false }) {
    if (!token) {
        throw new Error('Please include the token to revoke');
    }
    isValidClientId(clientId);
    if (!isValidString(issuer) ||
        (serviceConfiguration && !isValidString(serviceConfiguration.revocationEndpoint))) {
        throw new Error('Config error: you must provide either an issuer or a revocation endpoint');
    }
    let revocationEndpoint;
    if (serviceConfiguration && serviceConfiguration.revocationEndpoint) {
        revocationEndpoint = serviceConfiguration.revocationEndpoint;
    }
    else {
        const response = await fetch(`${issuer}/.well-known/openid-configuration`);
        const openidConfig = await response.json();
        invariant(openidConfig.revocation_endpoint, 'The OpenID config does not specify a revocation endpoint');
        revocationEndpoint = openidConfig.revocation_endpoint;
    }
    const body = `token=${token}${isClientIdProvided ? `&client_id=${clientId}` : ''}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    try {
        const results = await fetch(revocationEndpoint, {
            method: 'POST',
            headers,
            body,
        });
        return results;
    }
    catch (error) {
        throw new Error(`Failed to revoke token ${error.message}`);
    }
}
export const { OAuthRedirect, URLSchemes } = ExpoAppAuth;
//# sourceMappingURL=AppAuth.js.map