import invariant from 'invariant';

import { requestAsync } from './Fetch';

export type DiscoveryDocument = Record<string, string | boolean | string[]> & {
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint?: string;
  userinfo_endpoint?: string;
  registration_endpoint?: string;
  end_session_endpoint?: string;
  claims_supported?: string[];
  check_session_iframe?: string;
  backchannel_logout_supported?: boolean;
  backchannel_logout_session_supported?: boolean;
  code_challenge_methods_supported?: string[];
  device_authorization_endpoint?: string;
  frontchannel_logout_session_supported?: boolean;
  frontchannel_logout_supported?: boolean;
  grant_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  introspection_endpoint?: string;
  issuer?: string;
  jwks_uri?: string;
  request_parameter_supported?: boolean;
  response_modes_supported?: string[];
  scopes_supported?: string[];
  subject_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
};

export interface Discovery {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  // The spec requires a revocation endpoint but some providers (like Spotify) do not support one.
  revocationEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  // Dynamic client registration endpoint
  registrationEndpoint?: string;

  discoveryDocument: DiscoveryDocument;
}

export type IssuerOrDiscovery = string | Discovery;

/**
 * Append the well known resources path and OpenID connect discovery document path to a URL
 * https://tools.ietf.org/html/rfc5785
 */
export function issuerWithWellKnownUrl(issuer: string): string {
  return `${issuer}/.well-known/openid-configuration`;
}

export async function fetchDiscoveryAsync(issuer: string): Promise<Discovery> {
  const json = await requestAsync<DiscoveryDocument>(issuerWithWellKnownUrl(issuer), {
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
 * Utility method for resolving the discovery document from an issuer or object.
 *
 * @param issuerOrDiscovery
 */
export async function resolveDiscoveryAsync(
  issuerOrDiscovery: IssuerOrDiscovery
): Promise<Discovery> {
  invariant(
    issuerOrDiscovery && !['number', 'boolean'].includes(typeof issuerOrDiscovery),
    'Expected a valid discovery object or issuer URL'
  );
  if (typeof issuerOrDiscovery === 'string') {
    return await fetchDiscoveryAsync(issuerOrDiscovery);
  }
  return issuerOrDiscovery;
}
