import { AuthRequest } from '../AuthRequest';
import { CodeChallengeMethod } from '../AuthRequest.types';
import { buildQueryString, getQueryParams } from '../QueryParams';

jest.mock('expo-random', () => ({
  getRandomBytesAsync: jest.fn(async () => ''),
  getRandomBase64StringAsync: jest.fn(async () => ''),
}));
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => ''),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { BASE64: 'BASE64' },
}));

const mockDiscovery = {
  authorizationEndpoint: 'https://demo.io',
  tokenEndpoint: 'https://demo.io',
};

// The spec dictates that Plain should only be used on devices that don't support S256.
// Expo doesn't run on any device like this.
it(`does not allow plain code challenge method`, () => {
  expect(
    () =>
      // @ts-ignore
      new AuthRequest({ redirectUri: 'com://auth', codeChallengeMethod: CodeChallengeMethod.Plain })
  ).toThrow(/does not support `CodeChallengeMethod.Plain`/);
});

it(`does not allow an empty redirectUri`, () => {
  expect(
    () =>
      // @ts-ignore
      new AuthRequest({ redirectUri: '' })
  ).toThrow(/requires a valid `redirectUri`/);
});

it(`loads a code verifier with PKCE enabled`, async () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
    usePKCE: true,
  });
  const config = await request.getAuthRequestConfigAsync();
  expect(config.codeChallenge).toBeDefined();
  expect(request.codeVerifier).toBeDefined();
});

it(`skips loading a code verifier with PKCE disabled`, async () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
    usePKCE: false,
  });
  const config = await request.getAuthRequestConfigAsync();
  expect(config.codeChallenge).not.toBeDefined();
  expect(request.codeVerifier).not.toBeDefined();
});

// Ensure a promise isn't accidentally returned
it(`always returns a state when loaded`, async () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
  });
  const config = await request.getAuthRequestConfigAsync();
  expect(typeof config.state).toBe('string');
});

it(`parses a valid return url`, () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
    // Ensure the state matches
    state: 'testvalue',
  });

  const results = request.parseReturnUrl(
    'https://demo.identityserver.io/connect/authorize?code_challenge=qOMOVEqLn0PTVkRFSSD4H5T-AQyZeZaFcr3fmu5gRKU&code_challenge_method=S256&client_secret=foobar&redirect_uri=bareexpo%3A%2F%2Foauthredirect&client_id=native.code&response_type=code&state=testvalue&scope=openid%20profile%20email%20offline_access'
  );
  expect(results.type).toBe('success');
});

it(`returns an error when the state doesn't match`, () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
    // Use a non-matching state
    state: 'wrongstate',
  });

  const results = request.parseReturnUrl(
    'https://demo.identityserver.io/connect/authorize?code_challenge=qOMOVEqLn0PTVkRFSSD4H5T-AQyZeZaFcr3fmu5gRKU&code_challenge_method=S256&client_secret=foobar&redirect_uri=bareexpo%3A%2F%2Foauthredirect&client_id=native.code&response_type=code&state=testvalue&scope=openid%20profile%20email%20offline_access'
  );
  if (results.type !== 'error' || !results.error) throw new Error('Invalid type for test');
  expect(results.error.code).toBe('state_mismatch');
});

it(`parses the server error into an AuthError`, () => {
  const request = new AuthRequest({
    redirectUri: 'foo://bar',
    clientId: '...',
    scopes: [],
    // Use a non-matching state
    state: 'somn',
  });

  const queryString = buildQueryString({ state: 'somn', error: 'invalid_request' });
  const results = request.parseReturnUrl(`https://demo.io?${queryString}`);
  if (results.type !== 'error' || !results.error) throw new Error('Invalid type for test');

  expect(results.error.code).toBe('invalid_request');
  // Ensure the extra message is added
  expect(results.error.message).toMatch(/The request is missing a required parameter/);
});

it(`can override the code_challenge with extraParams`, async () => {
  const request = new AuthRequest({
    clientId: '',
    scopes: [],
    redirectUri: 'foo://bar',
    usePKCE: true,
    extraParams: { code_challenge: 'custom-value' },
  });

  const url = await request.buildUrlAsync(mockDiscovery);
  expect(getQueryParams(url).params.code_challenge).toBe('custom-value');
});

// Tests `useAuthRequest`
// Ensure that when a mobile browser prompts, the URL is already loaded.
it(`loads an auth request`, async () => {
  const request = new AuthRequest({
    clientId: '',
    scopes: [],
    redirectUri: 'foo://bar',
    usePKCE: true,
    extraParams: { code_challenge: 'custom-value' },
  });
  await request.buildUrlAsync(mockDiscovery);

  expect(request.url).toMatch(/https:\/\/demo.io/);
  expect(request.codeVerifier).toBeDefined();
  expect(typeof request.state).toBe('string');
});
