// This is a pure JS module so testing with node is fine.

import {
  TokenResponse,
  getCurrentTimeInSeconds,
  AccessTokenRequest,
  RevokeTokenRequest,
  RefreshTokenRequest,
} from '../TokenRequest';
import { TokenTypeHint } from '../TokenRequest.types';

describe('AccessTokenRequest', () => {
  it(`creates a token exchange request`, async () => {
    const request = new AccessTokenRequest({
      code: 'bacon-some-code',
      redirectUri: 'bcn://oauth',
      clientId: 'my-client_id',
      scopes: ['test', 'value'],
    });
    // Test the query when the client secret isn't provided.
    expect(request.getQueryBody()).toStrictEqual({
      client_id: 'my-client_id',
      code: 'bacon-some-code',
      grant_type: 'authorization_code',
      redirect_uri: 'bcn://oauth',
      scope: 'test value',
    });

    // Test the JSON access.
    expect(request.getRequestConfig()).toStrictEqual({
      clientId: 'my-client_id',
      code: 'bacon-some-code',
      grantType: 'authorization_code',
      redirectUri: 'bcn://oauth',
      scopes: ['test', 'value'],
      clientSecret: undefined,
      extraParams: undefined,
      extraHeaders: undefined,
    });
    // No Authorization header is included when the client secret isn't present.
    expect(request.getHeaders()).toStrictEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });
  // This is required for reddit auth.
  it(`can generate a fake Authorization header when the client secret is an empty string`, async () => {
    const request = new AccessTokenRequest({
      code: 'bacon-some-code',
      clientSecret: '',
      redirectUri: 'bcn://oauth',
      clientId: 'my-client_id',
    });

    // Ensure the Authorization header is generated even with an empty string.
    expect(request.getHeaders()).toStrictEqual({
      Authorization: 'Basic bXktY2xpZW50X2lkOg==',
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });

  it(`creates a token exchange request with a client secret`, async () => {
    const request = new AccessTokenRequest({
      code: 'bacon-some-code',
      clientSecret: 'secret',
      redirectUri: 'bcn://oauth',
      clientId: 'my-client_id',
    });
    // Test the query doesn't include the client id when the secret is present.
    expect(request.getQueryBody()).toStrictEqual({
      code: 'bacon-some-code',
      grant_type: 'authorization_code',
      redirect_uri: 'bcn://oauth',
    });

    // Ensure the client secret is added to the headers.
    expect(request.getHeaders()).toStrictEqual({
      Authorization: 'Basic bXktY2xpZW50X2lkOnNlY3JldA==',
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });
  it(`creates a token exchange request with extra headers set`, async () => {
    const request = new AccessTokenRequest({
      code: 'odjie-some-code',
      redirectUri: 'bcn://oauth',
      clientId: 'my-client_id',
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
    });

    // Ensure the extraHeaders are set in the config
    expect(request.getRequestConfig()).toStrictEqual({
      clientId: 'my-client_id',
      clientSecret: undefined,
      code: 'odjie-some-code',
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
      extraParams: undefined,
      grantType: 'authorization_code',
      redirectUri: 'bcn://oauth',
      scopes: undefined,
    });

    // Ensure the extraHeaders are added to the headers.
    expect(request.getHeaders()).toStrictEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      'my-tx-id': 'some-tx-id',
      otherTxId: 'other-tx-id',
    });
  });
  it(`throws when a discovery doesn't contain a tokenEndpoint`, async () => {
    const request = new AccessTokenRequest({
      code: 'bacon-some-code',
      redirectUri: 'bcn://oauth',
      clientId: 'my-client_id',
    });
    expect(request.performAsync({ tokenEndpoint: undefined })).rejects.toThrow(
      'without a valid tokenEndpoint'
    );
  });
});

describe('RefreshTokenRequest', () => {
  it(`creates a token refresh request`, async () => {
    const request = new RefreshTokenRequest({
      refreshToken: 'refresh-token',
      clientId: 'my-client_id',
      scopes: ['test', 'value'],
      extraParams: {
        batman: 'and-robin',
      },
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
    });
    // Test the query when the client secret isn't provided.
    expect(request.getQueryBody()).toStrictEqual({
      client_id: 'my-client_id',
      grant_type: 'refresh_token',
      refresh_token: 'refresh-token',
      scope: 'test value',
      batman: 'and-robin',
    });

    // Test the JSON access.
    expect(request.getRequestConfig()).toStrictEqual({
      clientId: 'my-client_id',
      grantType: 'refresh_token',
      refreshToken: 'refresh-token',
      scopes: ['test', 'value'],
      clientSecret: undefined,
      extraParams: {
        batman: 'and-robin',
      },
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
    });
    // No Authorization header is included when the client secret isn't present.
    expect(request.getHeaders()).toStrictEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      'my-tx-id': 'some-tx-id',
      otherTxId: 'other-tx-id',
    });
  });

  it(`throws when a discovery doesn't contain a tokenEndpoint`, async () => {
    const request = new RefreshTokenRequest({
      refreshToken: 'refresh-token',
      clientId: 'my-client_id',
      scopes: ['test', 'value'],
    });
    expect(request.performAsync({ tokenEndpoint: undefined })).rejects.toThrow(
      'without a valid tokenEndpoint'
    );
  });
});

describe('RevokeTokenRequest', () => {
  it(`creates a token revocation request`, async () => {
    const request = new RevokeTokenRequest({
      token: 'my-token',
      tokenTypeHint: TokenTypeHint.AccessToken,
      clientId: 'my-client_id',
      scopes: ['test', 'value'],
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
    });
    // Test the query is serialized properly.
    expect(request.getQueryBody()).toStrictEqual({
      client_id: 'my-client_id',
      token: 'my-token',
      token_type_hint: 'access_token',
    });
    // Test the request config
    expect(request.getRequestConfig()).toStrictEqual({
      clientId: 'my-client_id',
      clientSecret: undefined,
      token: 'my-token',
      tokenTypeHint: 'access_token',
      extraHeaders: {
        'my-tx-id': 'some-tx-id',
        otherTxId: 'other-tx-id',
      },
    });
    // No Authorization header is included when the client secret isn't present
    // and the extraHeaders are set when set in config.
    expect(request.getHeaders()).toStrictEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
      'my-tx-id': 'some-tx-id',
      otherTxId: 'other-tx-id',
    });
  });

  it(`creates a token revocation request with a client secret`, async () => {
    const request = new RevokeTokenRequest({
      token: 'my-token',
      tokenTypeHint: TokenTypeHint.AccessToken,
      clientId: 'my-client_id',
      clientSecret: 'my-client_secret',
    });
    // Test the query is serialized properly.
    expect(request.getQueryBody()).toStrictEqual({
      // The client_id is currently being kept in the query body
      client_id: 'my-client_id',
      client_secret: 'my-client_secret',
      token: 'my-token',
      token_type_hint: 'access_token',
    });
    // Ensure the client secret is added to the headers.
    expect(request.getHeaders()).toStrictEqual({
      Authorization: 'Basic bXktY2xpZW50X2lkOm15LWNsaWVudF9zZWNyZXQ=',
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });
  it(`throws when a discovery doesn't contain a revocationEndpoint`, async () => {
    const request = new RevokeTokenRequest({
      token: 'my-token',
      tokenTypeHint: TokenTypeHint.AccessToken,
      clientId: 'my-client_id',
    });
    expect(request.performAsync({ revocationEndpoint: undefined })).rejects.toThrow(
      'without a valid revocationEndpoint'
    );
  });
});

describe('TokenResponse', () => {
  it(`can always refresh when no expiresIn attribute was provided`, () => {
    const tenMinsAgo = getCurrentTimeInSeconds() - 3600;
    const freshToken = new TokenResponse({ accessToken: '', issuedAt: tenMinsAgo });
    expect(TokenResponse.isTokenFresh(freshToken)).toBe(true);
  });
  it(`knows a token isn't fresh`, () => {
    const fiveMins = 1800;
    const tenMinsAgo = getCurrentTimeInSeconds() - 3600;
    const freshToken = new TokenResponse({
      accessToken: '',
      issuedAt: tenMinsAgo,
      expiresIn: fiveMins,
    });
    expect(TokenResponse.isTokenFresh(freshToken, 0)).toBe(false);
  });
});
