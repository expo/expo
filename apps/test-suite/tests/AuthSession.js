import * as AuthSession from 'expo-auth-session';
import * as PKCE from 'expo-auth-session/build/PKCE';

export const name = 'AuthSession';

// Open ID RP cert testing server https://openid.net/certification/rp_testing
// TODO(Bacon): Test exchanges
// const testUri = "https://rp.certification.openid.net:8080/expo-auth-session/";

export async function test({ describe, it, expect, jasmine }) {
  describe('OpenID Connect Auto Discovery', () => {
    const issuer = 'https://accounts.google.com';

    it('fetches a discovery document from an issuer', async () => {
      const discovery = await AuthSession.fetchDiscoveryAsync(issuer);
      expect(discovery.authorizationEndpoint).toEqual(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      expect(discovery.tokenEndpoint).toEqual('https://oauth2.googleapis.com/token');
      expect(discovery.revocationEndpoint).toEqual('https://oauth2.googleapis.com/revoke');
      expect(discovery.userInfoEndpoint).toEqual(
        'https://openidconnect.googleapis.com/v1/userinfo'
      );
    });
  });

  describe('PKCE', () => {
    it(`creates the expected challenge for a valid code`, async () => {
      const code = PKCE.generateRandom(43);
      const challenge = await PKCE.deriveChallengeAsync(code);
      expect(challenge).toBeTruthy();
      // No `==` in the base64 encoded result.
      expect(challenge.indexOf('=') < 0);
    });

    it(`generateRandom produces different values`, async () => {
      const code1 = PKCE.generateRandom(10);
      const code2 = PKCE.generateRandom(10);
      expect(code1).not.toEqual(code2);
    });

    it(`produces the right base64 encoded challenge`, async () => {
      const CODE = new Array(12).join('expo');
      const challenge = await PKCE.deriveChallengeAsync(CODE);
      expect(challenge).toEqual('J0cfOVZk6FKn67XzdP8stPFJ7bw2UY0hACisxoIefkU');
    });
  });
}
