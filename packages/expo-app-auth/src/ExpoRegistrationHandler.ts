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

export type ExpoRegistrationErrorJson = TokenErrorJson;

export class ExpoRegistrationError extends TokenError {}

export type ExpoRegistrationResponseJson = {
  client_id_issued_at: number;
  client_secret_expires_at: number;
  client_id: string;
  client_secret: string;
  registration_access_token: string;
  registration_client_uri: string;
  extras: StringMap;
};

export class ExpoRegistrationResponse {
  clientIDIssuedAt: number;
  clientSecretExpiresAt: number;
  clientID: string;
  clientSecret: string;
  registrationAccessToken: string;
  registrationClientURI: string;
  extras: StringMap;

  constructor(options: ExpoRegistrationResponseJson) {
    this.clientIDIssuedAt = options.client_id_issued_at;
    this.clientSecretExpiresAt = options.client_secret_expires_at;
    this.clientID = options.client_id;
    this.clientSecret = options.client_secret;
    this.registrationAccessToken = options.registration_access_token;
    this.registrationClientURI = options.registration_client_uri;
    this.extras = options.extras;
  }

  toJson() {
    return {
      client_id_issued_at: this.clientIDIssuedAt,
      client_secret_expires_at: this.clientSecretExpiresAt,
      client_id: this.clientID,
      client_secret: this.clientSecret,
      registration_access_token: this.registrationAccessToken,
      registration_client_uri: this.registrationClientURI,
    };
  }

  // TODO: bacon: add `isValid`
}

export interface ExpoRegistrationRequestJson {
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
  grant_types: GrantType[];
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
  initial_access_token?: string;
  extras?: Record<string, any>;
}

export type ExpoRegistrationApplicationType = 'web' | 'native';

export class ExpoRegistrationRequest {
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

  redirectURIs: string[];
  responseTypes: string[];
  grantTypes: GrantType[];
  subjectType?: string;
  tokenEndpointAuthMethod?: string;
  initialAccessToken?: string;
  extras?: Record<string, any>;
  /**
   * Must always be native
   * https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
   */
  applicationType: ExpoRegistrationApplicationType = Platform.select({
    web: 'web',
    default: 'native',
  });

  constructor(options: ExpoRegistrationRequestJson) {
    this.redirectURIs = options.redirect_uris;
    this.responseTypes = options.response_types;
    this.grantTypes = options.grant_types;
    this.subjectType = options.subject_type;
    this.tokenEndpointAuthMethod = options.token_endpoint_auth_method;
    this.initialAccessToken = options.initial_access_token;
    this.extras = options.extras;
  }

  toJson() {
    return {
      redirect_uris: this.redirectURIs.join(' '),
      response_types: this.responseTypes.join(' '),
      grant_types: this.grantTypes.join(' '),
      subject_type: this.subjectType || '',
      application_type: this.applicationType || '',
      token_endpoint_auth_method: this.tokenEndpointAuthMethod || '',
      initial_access_token: this.initialAccessToken || '',
    };
  }

  toStringMap(): StringMap {
    const map = this.toJson();

    // copy over extras
    if (this.extras) {
      for (let extra in this.extras) {
        if (extra in this.extras && !(extra in map)) {
          // check before inserting to requestMap
          map[extra] = this.extras[extra];
        }
      }
    }
    return map;
  }
}

export class ExpoRegistrationHandler {
  constructor(
    public requestor: Requestor = new ExpoRequestor(),
    public utils: QueryStringUtils = new BasicQueryStringUtils()
  ) {}

  private isRegistrationResponse(
    response: ExpoRegistrationResponseJson | ExpoRegistrationErrorJson
  ): response is ExpoRegistrationResponseJson {
    return (response as ExpoRegistrationErrorJson).error === undefined;
  }

  async performRegistrationRequest(
    configuration: ExpoAuthorizationServiceConfiguration,
    request: ExpoRegistrationRequest
  ): Promise<ExpoRegistrationResponse> {
    if (!configuration.registrationEndpoint) {
      throw new ExpoRegistrationError({
        error_description:
          'The registration request could not be created because the registration URL is missing.',
        error: 'invalid_request',
      });
    }
    const response = await this.requestor.xhr<
      ExpoRegistrationResponseJson | ExpoRegistrationErrorJson
    >({
      url: configuration.registrationEndpoint,
      method: 'POST',
      dataType: 'json', // adding implicit dataType
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: this.utils.stringify(request.toStringMap()),
    });

    if (this.isRegistrationResponse(response)) {
      return new ExpoRegistrationResponse(response);
    }

    throw new AppAuthError(response.error, new ExpoRegistrationError(response));
  }
}
