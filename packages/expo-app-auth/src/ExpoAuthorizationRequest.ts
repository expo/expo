import { AuthorizationRequest, AuthorizationRequestJson, Crypto, StringMap } from '@openid/appauth';
import invariant from 'invariant';
import { Platform } from 'react-native';
import { ExpoCrypto } from './ExpoCrypto';

export type CodeChallengeMethod = 'S256' | 'plain';

export interface ExpoAuthorizationRequestJson {
  responseType?: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  extras?: StringMap;
  internal?: StringMap;
}

const SIZE = 10; // 10 bytes (like Node)

const CHALLENGE_METHOD = 'S256';

/**
 * Represents the AuthorizationRequest.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export class ExpoAuthorizationRequest extends AuthorizationRequest {
  // NOTE:
  // Both redirect_uri and state are actually optional.
  // However AppAuth is more opionionated, and requires you to use both.

  _crypto: Crypto;
  _usePkce: boolean;

  /**
   * Constructs a new AuthorizationRequest.
   * Use a `undefined` value for the `state` parameter, to generate a random
   * state for CSRF protection.
   */
  constructor(
    request: ExpoAuthorizationRequestJson,
    // @ts-ignore: This requires a sync method
    _crypto: Crypto = new ExpoCrypto(),
    _usePkce: boolean = true
  ) {
    invariant(
      request.responseType,
      `\`ExpoAuthorizationRequest\` requires a valid \`responseType\`.`
    );
    invariant(
      request.redirectUri,
      `\`ExpoAuthorizationRequest\` requires a valid \`redirectUri\`. Example: ${Platform.select({
        web: 'https://yourwebsite.com/',
        default: 'com.your.app:/oauthredirect',
      })}`
    );
    super(
      {
        response_type: request.responseType!,
        client_id: request.clientId,
        redirect_uri: request.redirectUri,
        scope: (request.scopes || []).join(' '),
        state: request.state,
        extras: request.extras,
        internal: request.internal,
      },
      _crypto,
      _usePkce
    );

    this._crypto = _crypto;
    this._usePkce = _usePkce;

    // @ts-ignore: hack to prevent unsafe, this is reassigned in setupCodeVerifier if it's null
    this.state = null;
  }

  async setupCodeVerifier(): Promise<void> {
    if (this.state == null) {
      this.state = await this._crypto.generateRandom(SIZE);
    }
    if (!this._usePkce || this.internal?.code_verifier) {
      return;
    }

    // This method needs to be resolved like all other native methods.
    const codeVerifier = await this._crypto.generateRandom(128);

    const result = await this._crypto.deriveChallenge(codeVerifier);

    if (result) {
      // keep track of the code used.
      this.internal = this.internal || {};
      this.internal.code_verifier = codeVerifier;
      this.extras = this.extras || {};
      this.extras.code_challenge = result;
      // We always use S256. Plain is not good enough.
      this.extras.code_challenge_method = CHALLENGE_METHOD;
    }
  }

  /**
   * Serializes the AuthorizationRequest to a JavaScript Object.
   */
  async toJson(): Promise<AuthorizationRequestJson> {
    await this.setupCodeVerifier();
    // Always make sure that the code verifier is setup when toJson() is called.
    return {
      response_type: this.responseType,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: this.state,
      extras: this.extras,
      internal: this.internal,
    };
  }
}
