import { CodedError, UnavailabilityError } from 'expo-modules-core';
import invariant from 'invariant';
import ExpoAppAuth from './ExpoAppAuth';
export * from './AppAuth.types';
function isValidServiceConfiguration(config) {
    return !!(config &&
        typeof config.authorizationEndpoint === 'string' &&
        typeof config.tokenEndpoint === 'string');
}
function assertValidClientId(clientId) {
    if (typeof clientId !== 'string' || !clientId.length) {
        throw new CodedError('ERR_APP_AUTH_INVALID_CONFIG', '`clientId` must be a string with more than 0 characters');
    }
}
function assertValidProps({ issuer, redirectUrl, clientId, serviceConfiguration, }) {
    if (typeof issuer !== 'string' && !isValidServiceConfiguration(serviceConfiguration)) {
        throw new CodedError('ERR_APP_AUTH_INVALID_CONFIG', 'You must provide either an `issuer` or both `authorizationEndpoint` and `tokenEndpoint`');
    }
    if (typeof redirectUrl !== 'string') {
        throw new CodedError('ERR_APP_AUTH_INVALID_CONFIG', '`redirectUrl` must be a string');
    }
    assertValidClientId(clientId);
}
async function _executeAsync(props) {
    if (!props.redirectUrl) {
        props.redirectUrl = getDefaultOAuthRedirect();
    }
    assertValidProps(props);
    return await ExpoAppAuth.executeAsync(props);
}
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export function getDefaultOAuthRedirect() {
    return `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
}
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export async function authAsync(props) {
    if (!ExpoAppAuth.executeAsync) {
        throw new UnavailabilityError('expo-app-auth', 'authAsync');
    }
    return await _executeAsync(props);
}
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export async function refreshAsync(props, refreshToken) {
    if (!ExpoAppAuth.executeAsync) {
        throw new UnavailabilityError('expo-app-auth', 'refreshAsync');
    }
    if (!refreshToken) {
        throw new CodedError('ERR_APP_AUTH_TOKEN', 'Cannot refresh with null `refreshToken`');
    }
    return await _executeAsync({
        isRefresh: true,
        refreshToken,
        ...props,
    });
}
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export async function revokeAsync({ clientId, issuer, serviceConfiguration }, { token, isClientIdProvided = false }) {
    if (!token) {
        throw new CodedError('ERR_APP_AUTH_TOKEN', 'Cannot revoke a null `token`');
    }
    assertValidClientId(clientId);
    let revocationEndpoint;
    if (serviceConfiguration && serviceConfiguration.revocationEndpoint) {
        revocationEndpoint = serviceConfiguration.revocationEndpoint;
    }
    else {
        // For Open IDC providers only.
        const response = await fetch(`${issuer}/.well-known/openid-configuration`);
        const openidConfig = await response.json();
        invariant(openidConfig.revocation_endpoint, 'The OpenID config does not specify a revocation endpoint');
        revocationEndpoint = openidConfig.revocation_endpoint;
    }
    const encodedClientID = encodeURIComponent(clientId);
    const encodedToken = encodeURIComponent(token);
    const body = `token=${encodedToken}${isClientIdProvided ? `&client_id=${encodedClientID}` : ''}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    try {
        // https://tools.ietf.org/html/rfc7009#section-2.2
        const results = await fetch(revocationEndpoint, {
            method: 'POST',
            headers,
            body,
        });
        return results;
    }
    catch (error) {
        throw new CodedError('ERR_APP_AUTH_REVOKE_FAILED', error.message);
    }
}
export const { 
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
OAuthRedirect, 
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
URLSchemes, } = ExpoAppAuth;
//# sourceMappingURL=AppAuth.js.map