//@flow
import { NativeModulesProxy } from 'expo-core';
import invariant from 'invariant';
const { ExpoAppAuth } = NativeModulesProxy;

export type OAuthServiceConfiguration = {
  revocationEndpoint?: string,
  authorizationEndpoint?: string,
  registrationEndpoint?: string,
  tokenEndpoint: string,
};

export type OAuthParameters = {
  login_hint?: string,
  display?: string,
  prompt?: string,
  [string]: any,
};

export type OAuthProps = {
  issuer: string,
  redirectUrl?: string,
  clientId: string,
  clientSecret?: string,
  scopes?: Array<string>,
  additionalParameters?: OAuthParameters,
  canMakeInsecureRequests?: boolean,
  serviceConfiguration?: OAuthServiceConfiguration,
};

export type OAuthRevokeOptions = {
  token: string,
  isClientIdProvided: boolean,
};

const isValidString = (s: ?string): boolean => s && typeof s === 'string';

function isValidClientId(clientId: ?string): void {
  if (!isValidString(clientId)) throw new Error('Config error: clientId must be a string');
}

function isValidProps({
  isRefresh,
  issuer,
  redirectUrl,
  clientId,
  clientSecret,
  scopes,
  additionalParameters,
  serviceConfiguration,
}: OAuthProps): void {
  const _serviceConfigIsValid =
    serviceConfiguration &&
    isValidString(serviceConfiguration.authorizationEndpoint) &&
    isValidString(serviceConfiguration.tokenEndpoint);

  if (!isValidString(issuer) && !_serviceConfigIsValid)
    throw new Error('Invalid you must provide either an issuer or a service endpoints');
  if (!isValidString(redirectUrl)) throw new Error('Config error: redirectUrl must be a string');
  isValidClientId(clientId);
}

function _executeAsync(props: OAuthProps): Promise {
  if (!props.redirectUrl) {
    props.redirectUrl = `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
  }
  isValidProps(props);
  return ExpoAppAuth.executeAsync(props);
}

export function authorizeAsync(props: OAuthProps): Promise {
  return _executeAsync(props);
}

export function refreshAsync(props: OAuthProps, refreshToken: string): Promise {
  if (!refreshToken) throw new Error('Please pass in a refresh token');
  return _executeAsync({
    isRefresh: true,
    refreshToken,
    ...props,
  });
}

export async function revokeAsync(
  { clientId, issuer, serviceConfiguration }: OAuthProps,
  { token, isClientIdProvided = false }: OAuthRevokeOptions
): Promise {
  if (!token) throw new Error('Please include the token to revoke');

  isValidClientId(clientId);

  if (
    !isValidString(issuer) ||
    (serviceConfiguration && !isValidString(serviceConfiguration.revocationEndpoint))
  ) {
    throw new Error('Config error: you must provide either an issuer or a revocation endpoint');
  }

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

  return await fetch(revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `token=${token}${isClientIdProvided ? `&client_id=${clientId}` : ''}`,
  }).catch(error => {
    throw new Error(`Failed to revoke token ${error.message}`, error);
  });
}

export const { OAuthRedirect, URLSchemes } = ExpoAppAuth;
