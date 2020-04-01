import {
  AuthorizationServiceConfiguration,
  AuthorizationServiceConfigurationJson,
  Requestor,
} from '@openid/appauth';

import { ExpoRequestor } from './ExpoRequestor';

/**
 * The standard base path for well-known resources on domains.
 * See https://tools.ietf.org/html/rfc5785 for more information.
 */
const WELL_KNOWN_PATH = '.well-known';

/**
 * The standard resource under the well known path at which an OpenID Connect
 * discovery document can be found under an issuer's base URI.
 */
const OPENID_CONFIGURATION = 'openid-configuration';

/**
 * Represents AuthorizationServiceConfiguration as a user-friendly JSON object.
 * Adds support for dynamic URI registration.
 */
export interface ExpoAuthorizationServiceConfigurationJson {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  // The API specifies that this should be required, but some servers like Spotify do not provide one.
  revocationEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  /**
   * The dynamic client registration endpoint URI.
   */
  registrationEndpoint?: string;
}

export type DiscoveryDocument = Record<string, string | boolean | string[]> & {
  authorization_endpoint?: string;
  token_endpoint?: string;
  revocation_endpoint?: string;
  userinfo_endpoint?: string;
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

/**
 * Configuration details required to interact with an authorization service.
 * Expo adds support for discoveryDocument
 *
 * More information at https://openid.net/specs/openid-connect-discovery-1_0-17.html
 */
export class ExpoAuthorizationServiceConfiguration extends AuthorizationServiceConfiguration {
  discoveryDocument: DiscoveryDocument;
  registrationEndpoint?: string;

  constructor({
    authorizationEndpoint: authorization_endpoint,
    tokenEndpoint: token_endpoint,
    revocationEndpoint: revocation_endpoint,
    userInfoEndpoint: userinfo_endpoint,
    endSessionEndpoint: end_session_endpoint,
    registrationEndpoint,
    ...request
  }: ExpoAuthorizationServiceConfigurationJson) {
    super({
      authorization_endpoint,
      token_endpoint,
      // @ts-ignore: A useful error will be thrown if you try to revoke a token without an endpoint.
      revocation_endpoint,
      userinfo_endpoint,
      end_session_endpoint,
    });

    this.discoveryDocument = {
      ...request,
      authorization_endpoint,
      token_endpoint,
      revocation_endpoint,
      userinfo_endpoint,
      end_session_endpoint,
    } as any;

    this.registrationEndpoint = registrationEndpoint;
  }

  // @ts-ignore: Invalid extension
  toJson(): DiscoveryDocument {
    return this.discoveryDocument;
  }

  static async fetchFromIssuer(
    openIdIssuerUrl: string,
    requestor?: Requestor
  ): Promise<ExpoAuthorizationServiceConfiguration> {
    const fullUrl = `${openIdIssuerUrl}/${WELL_KNOWN_PATH}/${OPENID_CONFIGURATION}`;

    const requestorToUse = requestor || new ExpoRequestor();

    const {
      authorization_endpoint,
      token_endpoint,
      revocation_endpoint,
      userinfo_endpoint,
      end_session_endpoint,
      registration_endpoint,
      ...json
    } = (await requestorToUse.xhr<AuthorizationServiceConfigurationJson>({
      url: fullUrl,
      dataType: 'json',
      method: 'GET',
    })) as any;
    return new ExpoAuthorizationServiceConfiguration({
      ...json,
      authorizationEndpoint: authorization_endpoint,
      tokenEndpoint: token_endpoint,
      revocationEndpoint: revocation_endpoint,
      userInfoEndpoint: userinfo_endpoint,
      endSessionEndpoint: end_session_endpoint,
      registrationEndpoint: registration_endpoint,
    });
  }
}
