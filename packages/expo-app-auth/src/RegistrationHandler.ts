import {
  AppAuthError,
  BasicQueryStringUtils,
  QueryStringUtils,
  Requestor,
  StringMap,
  TokenError,
  TokenErrorJson,
} from '@openid/appauth';
import { Platform } from 'react-native';

import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
import { ExpoRequestor } from './ExpoRequestor';
import GrantType from './GrantType';

// A custom module built to replicate the native dynamic register functionality

export type RegistrationErrorJson = TokenErrorJson;

export class RegistrationError extends TokenError {}

export type RegistrationResponseJson = {
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
  client_id: string;
  client_secret?: string;
  registration_access_token: string;
  registration_client_uri: string;
  extras: StringMap;
};

export class RegistrationResponse {
  clientIdIssuedAt?: number;
  clientSecretExpiresAt?: number;
  clientId: string;
  clientSecret?: string;
  registrationAccessToken: string;
  registrationClientUri: string;
  extras: StringMap;

  constructor(options: RegistrationResponseJson) {
    this.clientIdIssuedAt = options.client_id_issued_at;
    this.clientSecretExpiresAt = options.client_secret_expires_at;
    this.clientId = options.client_id;
    this.clientSecret = options.client_secret;
    this.registrationAccessToken = options.registration_access_token;
    this.registrationClientUri = options.registration_client_uri;
    this.extras = options.extras;
  }

  toJson() {
    return {
      client_id_issued_at: this.clientIdIssuedAt,
      client_secret_expires_at: this.clientSecretExpiresAt,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      registration_access_token: this.registrationAccessToken,
      registration_client_uri: this.registrationClientUri,
    };
  }

  // TODO: bacon: add `isValid`
}

export interface RegistrationRequestJson {
  /**
   * Client's redirect URI's
   *
   * https://tools.ietf.org/html/rfc6749#section-3.1.2
   */
  redirect_uris: string[];
  /**
   * Response types to use.
   *
   * [OpenID Connect Core 1.0, Section 3](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3)
   */
  response_types: string[];
  /**
   * Grant types to use.
   *
   * [OpenID Connect Dynamic Client Registration 1.0, Section 2](https://openid.net/specs/openid-connect-discovery-1_0.html#rfc.section.2)
   */
  grant_types?: GrantType[];
  /**
   * Subject type to use.
   *
   * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
   */
  subject_type?: string;
  /**
   * Client auth method to use at the token endpoint.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  token_endpoint_auth_method?: string;
  /**
   * The initial access token to access the Client Registration Endpoint (if required by the OpenID Provider).
   * OAuth 2.0 Access Token optionally issued by an Authorization Server granting
   * access to its Client Registration Endpoint. This token (if required) is
   * provisioned out of band.
   *
   * [Section 3 of OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html#ClientRegistration)
   */
  initial_access_token?: string;
  extras?: Record<string, any>;
}

export type RegistrationApplicationType = 'web' | 'native' | 'browser' | 'service';

export class RegistrationRequest {
  /**
   * Instructs the authorization server to generate a pairwise subject identifier.
   *
   * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
   */
  public static SUBJECT_TYPE_PAIRWISE = 'pairwise';

  /**
   * Instructs the authorization server to generate a public subject identifier.
   *
   * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
   */
  public static SUBJECT_TYPE_PUBLIC = 'public';

  /**
   * Clients that have received a client_secret value from the Authorization Server authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] using the HTTP Basic authentication scheme.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  public static CLIENT_AUTH_CLIENT_SECRET_BASIC = 'client_secret_basic';
  /**
   * Clients that have received a client_secret value from the Authorization Server, authenticate with the Authorization Server in accordance with Section 2.3.1 of OAuth 2.0 [RFC6749] by including the Client Credentials in the request body.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  public static CLIENT_AUTH_CLIENT_SECRET_POST = 'client_secret_post';
  /**
   * Clients that have received a client_secret value from the Authorization Server create a JWT using an HMAC SHA algorithm, such as HMAC SHA-256. The HMAC (Hash-based Message Authentication Code) is calculated using the octets of the UTF-8 representation of the client_secret as the shared key.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  public static CLIENT_AUTH_CLIENT_SECRET_JWT = 'client_secret_jwt';
  /**
   * Clients that have registered a public key sign a JWT using that key.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  public static CLIENT_AUTH_PRIVATE_KEY_JWT = 'private_key_jwt';
  /**
   * The Client does not authenticate itself at the Token Endpoint, either because it uses only the Implicit Flow (and so does not use the Token Endpoint) or because it is a Public Client with no Client Secret or other authentication mechanism.
   *
   * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
   */
  public static CLIENT_AUTH_NONE = 'none';

  redirectUris: string[];
  responseTypes: string[];
  grantTypes?: GrantType[];
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  initialAccessToken?: string;
  extras?: Record<string, any>;
  /**
   * Must always be native
   * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
   */
  applicationType: RegistrationApplicationType = Platform.select({
    web: 'web',
    default: 'native',
  });

  constructor(options: RegistrationRequestJson) {
    this.redirectUris = options.redirect_uris;
    this.responseTypes = options.response_types;
    this.grantTypes = options.grant_types;
    this.subjectType = options.subject_type;
    this.tokenEndpointAuthMethod = options.token_endpoint_auth_method;
    this.initialAccessToken = options.initial_access_token;
    this.extras = options.extras;
  }

  toJson() {
    return {
      redirect_uris: (this.redirectUris ?? []).join(' '),
      response_types: (this.responseTypes ?? []).join(' '),
      grant_types: (this.grantTypes ?? []).join(' '),
      subject_type: this.subjectType ?? '',
      application_type: this.applicationType,
      token_endpoint_auth_method: this.tokenEndpointAuthMethod ?? '',
      initial_access_token: this.initialAccessToken ?? '',
    };
  }

  toStringMap(): StringMap {
    const {
      redirect_uris,
      response_types,
      grant_types,
      subject_type,
      application_type,
      token_endpoint_auth_method,
    } = this.toJson();

    const map: StringMap = {
      redirect_uris,
      application_type,
    };

    // Add extras first to allow them
    // to be overwritten by request json
    if (this.extras) {
      for (const extra in this.extras) {
        if (extra in this.extras && !(extra in map)) {
          // check before inserting to requestMap
          map[extra] = this.extras[extra];
        }
      }
    }

    if (response_types) {
      map.response_types = response_types;
    }
    if (grant_types) {
      map.grant_types = grant_types;
    }
    if (subject_type) {
      map.subject_type = subject_type;
    }
    if (token_endpoint_auth_method) {
      map.token_endpoint_auth_method = token_endpoint_auth_method;
    }

    return map;
  }
}

export class RegistrationHandler {
  constructor(
    public requestor: Requestor = new ExpoRequestor(),
    public utils: QueryStringUtils = new BasicQueryStringUtils()
  ) {}

  protected isRegistrationResponse(
    response: RegistrationResponseJson | RegistrationErrorJson
  ): response is RegistrationResponseJson {
    return (response as RegistrationErrorJson).error === undefined;
  }

  protected getHeaders(request: RegistrationRequest): StringMap {
    const headers: StringMap = { 'Content-Type': 'application/x-www-form-urlencoded' };
    // From the OAuth2 RFC, client ID and secret should be encoded prior to concatenation and
    // conversion to Base64: https://tools.ietf.org/html/rfc6749#section-2.3.1
    if (typeof request.initialAccessToken !== 'undefined') {
      const encodedInitialAccessToken = encodeURIComponent(request.initialAccessToken);
      headers.Authorization = `Bearer ${encodedInitialAccessToken}`;
    }

    return headers;
  }

  async performRegistrationRequest(
    configuration: ExpoAuthorizationServiceConfiguration,
    request: RegistrationRequest
  ): Promise<RegistrationResponse> {
    if (!configuration.registrationEndpoint) {
      throw new RegistrationError({
        error_description:
          'The registration request could not be created because the registration URL is missing.',
        error: 'invalid_request',
      });
    }
    const response = await this.requestor.xhr<RegistrationResponseJson | RegistrationErrorJson>({
      url: configuration.registrationEndpoint,
      method: 'POST',
      dataType: 'json', // adding implicit dataType
      headers: this.getHeaders(request),
      data: this.utils.stringify(request.toStringMap()),
    });

    if (this.isRegistrationResponse(response)) {
      return new RegistrationResponse(response);
    }

    throw new AppAuthError(response.error, new RegistrationError(response));
  }
}
