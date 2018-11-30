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

/* ASCII string value that specifies how the Authorization Server displays the authentication and consent user interface pages to the End-User. */
export type OAuthDisplayParameter = 'page' | 'popup' | 'touch' | 'wap';

/*
 * Space delimited, case sensitive list of ASCII string values that specifies whether the Authorization
 * Server prompts the End-User for reauthentication and consent.
 */
export type OAuthPromptParameter = 'none' | 'login' | 'consent' | 'select_account';

/*
 * String value used to associate a Client session with an ID Token, and to mitigate replay attacks.
 * The value is passed through unmodified from the Authentication Request to the ID Token.
 * Sufficient entropy MUST be present in the nonce values used to prevent attackers from guessing values.
 * For implementation notes, see: https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
 */
export type OAuthNonceParameter = string;

/*
 * End-User's preferred languages and scripts for the user interface,
 * represented as a space-separated list of BCP47 [RFC5646] language tag values, ordered by preference.
 * For instance, the value "fr-CA fr en" represents a preference for French as spoken in Canada, then French (without a region designation),
 * followed by English (without a region designation).
 * An error SHOULD NOT result if some or all of the requested locales are not supported by the OpenID Provider.
 */
export type OAuthUILocalesParameter = string;

/*
 * ID Token previously issued by the Authorization Server being passed as a
 * hint about the End-User's current or past authenticated session with the Client.
 * If the End-User identified by the ID Token is logged in or is logged in by the
 * request, then the Authorization Server returns a positive response; otherwise,
 * it SHOULD return an error, such as login_required.
 * When possible, an id_token_hint SHOULD be present when prompt=none is used and an
 *  invalid_request error MAY be returned if it is not; however, the server
 * SHOULD respond successfully when possible, even if it is not present.
 * The Authorization Server need not be listed as an audience of the ID
 * Token when it is used as an id_token_hint value.
 * If the ID Token received by the RP from the OP is encrypted, to use it as an
 * `id_token_hint`, the Client MUST decrypt the signed ID Token contained within the
 * encrypted ID Token.
 * The Client MAY re-encrypt the signed ID token to the Authentication Server using
 * a key that enables the server to decrypt the ID Token, and use the re-encrypted
 * ID token as the `id_token_hint` value.
 */
export type OAuthIDTokenHintParameter = string;

/*
 * Maximum Authentication Age.
 * Specifies the allowable elapsed time in seconds since the last time the End-User was actively authenticated by the OP.
 * If the elapsed time is greater than this value, the OP MUST attempt to actively re-authenticate the End-User.
 * (The max_age request parameter corresponds to the OpenID 2.0
 * https://openid.net/specs/openid-connect-core-1_0.html#OpenID.PAPE `max_auth_age` request parameter.)
 * When max_age is used, the ID Token returned MUST include an auth_time Claim Value.
 */
export type OAuthMaxAgeParameter = string;

/*
 * Hint to the Authorization Server about the login identifier the End-User
 * might use to log in (if necessary).
 * This hint can be used by an RP if it first asks the End-User for their
 * e-mail address (or other identifier) and then wants to pass that value
 * as a hint to the discovered authorization service.
 * It is RECOMMENDED that the hint value match the value used for discovery.
 * This value MAY also be a phone number in the format specified for the
 * `phone_number` Claim.
 * The use of this parameter is left to the OP's discretion.
 */
export type OAuthLoginHintParameter = string;

/*
 * Requested Authentication Context Class Reference values.
 * Space-separated string that specifies the acr values that the Authorization Server
 * is being requested to use for processing this Authentication Request, with the
 * values appearing in order of preference.
 * The Authentication Context Class satisfied by the authentication performed is
 * returned as the acr Claim Value, as specified in Section 2.
 * The acr Claim is requested as a Voluntary Claim by this parameter.
 */
export type OAuthACRValuesParameter = string;

export type OAuthParameters = {
  nonce?: OAuthNonceParameter,
  display?: OAuthParametersDisplay,
  prompt?: OAuthPromptParameter,
  max_age?: OAuthMaxAgeParameter,
  ui_locales?: OAuthUILocalesParameter,
  id_token_hint?: OAuthIDTokenHintParameter,
  login_hint?: OAuthLoginHintParameter,
  acr_values?: OAuthACRValuesParameter,
  [string]: string,
};

export type OAuthBaseProps = {
  clientId: string,
  issuer: string,
  serviceConfiguration?: OAuthServiceConfiguration,
};

export type OAuthProps = OAuthBaseProps & {
  redirectUrl?: string,
  clientSecret?: string,
  scopes?: Array<string>,
  additionalParameters?: OAuthParameters,
  canMakeInsecureRequests?: boolean,
};

export type OAuthRevokeOptions = {
  token: string,
  isClientIdProvided: boolean,
};

export type TokenResponse = {
  accessToken: string | null,
  accessTokenExpirationDate: string | null,
  additionalParameters: { [string]: any } | null,
  idToken: string | null,
  tokenType: string | null,
  refreshToken?: string,
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

async function _executeAsync(props: OAuthProps): Promise<TokenResponse> {
  if (!props.redirectUrl) {
    props.redirectUrl = `${ExpoAppAuth.OAuthRedirect}:/oauthredirect`;
  }
  isValidProps(props);
  return await ExpoAppAuth.executeAsync(props);
}

export async function authAsync(props: OAuthProps): Promise<TokenResponse> {
  return await _executeAsync(props);
}

export async function refreshAsync(
  props: OAuthProps,
  refreshToken: string
): Promise<TokenResponse> {
  if (!refreshToken) throw new Error('Please include the refreshToken');
  return await _executeAsync({
    isRefresh: true,
    refreshToken,
    ...props,
  });
}

export async function revokeAsync(
  { clientId, issuer, serviceConfiguration }: OAuthBaseProps,
  { token, isClientIdProvided = false }: OAuthRevokeOptions
): Promise<any> {
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

  const body = `token=${token}${isClientIdProvided ? `&client_id=${clientId}` : ''}`;
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
