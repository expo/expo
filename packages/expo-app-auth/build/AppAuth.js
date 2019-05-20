import { CodedError, UnavailabilityError } from '@unimodules/core';
import invariant from 'invariant';
import ExpoAppAuth from './ExpoAppAuth';
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
export function getDefaultOAuthRedirect() {
    return `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
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
        throw new CodedError('ERR_APP_AUTH_TOKEN', 'Cannot refresh with null `refreshToken`');
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
async function parseAuthRevocationResults(results) {
    const data = await results.json();
    const token = results.headers['update-client-auth'];
    // the token has been revoked successfully or the client submitted an invalid token.
    if (results.ok) {
        // successful op
        return { type: 'success', status: results.status, data, token };
    }
    else if (results.status == 503 && results.headers['retry-after']) {
        // Failed op
        const retryAfterValue = results.headers['retry-after'];
        let retryAfter;
        if (retryAfterValue) {
            retryAfter = parseRetryTime(retryAfterValue);
        }
        // the client must assume the token still exists and may retry after a reasonable delay.
        return { type: 'failed', status: results.status, data, token, retryAfter };
    }
    else {
        // Error
        return { type: 'error', status: results.status, data, token };
    }
}
function parseRetryTime(value) {
    // In accordance with RFC2616, Section 14.37. Timout may be of format seconds or future date time value
    if (/^\d+$/.test(value)) {
        return parseInt(value, 10) * 1000;
    }
    const retry = Date.parse(value);
    if (isNaN(retry)) {
        throw new CodedError('ERR_APP_AUTH_FETCH_RETRY_TIME', 'Cannot parse the Retry-After header value returned by the server: ' + value);
    }
    const now = Date.now();
    const parsedDate = new Date(retry);
    return parsedDate.getTime() - now;
}
export const { OAuthRedirect, URLSchemes } = ExpoAppAuth;
//# sourceMappingURL=AppAuth.js.map