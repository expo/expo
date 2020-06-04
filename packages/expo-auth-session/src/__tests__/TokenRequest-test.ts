import { AccessTokenRequest } from '../TokenRequest';

describe('AccessTokenRequest', () => {
  it('includes the code-verifier if supplied for an access token request', async () => {
    const codeVerifier = 'somethingrandom';

    const request = new AccessTokenRequest({
      clientId: 'abcd1234',
      redirectUri: 'foo://bar',
      code: '1234',
      codeVerifier,
    });

    const queryBody = request.getQueryBody();

    expect(queryBody.code_verifier).toBe(codeVerifier);
  });

  it("doesn't include the code-verifier if not supplied for an access token request", async () => {
    const request = new AccessTokenRequest({
      clientId: 'abcd1234',
      redirectUri: 'foo://bar',
      code: '1234',
    });

    const queryBody = request.getQueryBody();

    expect(queryBody.code_verifier).not.toBeDefined();
  });
});
