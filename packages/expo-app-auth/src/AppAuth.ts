import { UnavailabilityError } from 'expo-errors';
import invariant from 'invariant';

import {
  OAuthBaseProps,
  OAuthProps,
  OAuthRevokeOptions,
  OAuthServiceConfiguration,
  TokenResponse,
} from './AppAuth.types';
import ExpoAppAuth from './ExpoAppAuth';

export * from './AppAuth.types';

function isValidServiceConfiguration(config?: OAuthServiceConfiguration): boolean {
  return !!(
    config &&
    typeof config.authorizationEndpoint === 'string' &&
    typeof config.tokenEndpoint === 'string'
  );
}

function assertValidClientId(clientId?: string): void {
  if (typeof clientId !== 'string' || !clientId.length) {
    throw new Error('Config error: clientId must be a string');
  }
}

function assertValidProps({
  issuer,
  redirectUrl,
  clientId,
  serviceConfiguration,
}: OAuthProps): void {
  if (typeof issuer !== 'string' && !isValidServiceConfiguration(serviceConfiguration)) {
    throw new Error('Invalid you must provide either an issuer or a service endpoints');
  }
  if (typeof redirectUrl !== 'string') {
    throw new Error('Config error: redirectUrl must be a string');
  }
  assertValidClientId(clientId);
}

async function _executeAsync(props: OAuthProps): Promise<TokenResponse> {
  if (!props.redirectUrl) {
    props.redirectUrl = `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
  }
  assertValidProps(props);
  return await ExpoAppAuth.executeAsync(props);
}

export async function authAsync(props: OAuthProps): Promise<TokenResponse> {
  if (!ExpoAppAuth.executeAsync) {
    throw new UnavailabilityError('expo-app-auth', 'authAsync');
  }
  return await _executeAsync(props);
}

export async function refreshAsync(
  props: OAuthProps,
  refreshToken: string
): Promise<TokenResponse> {
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
export async function revokeAsync(
  { clientId, issuer, serviceConfiguration }: OAuthBaseProps,
  { token, isClientIdProvided = false }: OAuthRevokeOptions
): Promise<any> {
  if (!token) {
    throw new Error('Please include the token to revoke');
  }

  assertValidClientId(clientId);

  let revocationEndpoint;
  if (serviceConfiguration && serviceConfiguration.revocationEndpoint) {
    revocationEndpoint = serviceConfiguration.revocationEndpoint;
  } else {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`);
    const openidConfig = await response.json();

    invariant(
      openidConfig.revocation_endpoint,
      'The OpenID config does not specify a revocation endpoint'
    );

    revocationEndpoint = openidConfig.revocation_endpoint;
  }

  const encodedClientID = encodeURIComponent(clientId);
  const encodedToken = encodeURIComponent(token);
  const body = `token=${encodedToken}${isClientIdProvided ? `&client_id=${encodedClientID}` : ''}`;
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  try {
    const results = await fetch(revocationEndpoint, {
      method: 'POST',
      headers,
      body,
    });
    return results;
  } catch (error) {
    throw new Error(`Failed to revoke token ${error.message}`);
  }
}

export const { OAuthRedirect, URLSchemes } = ExpoAppAuth;
