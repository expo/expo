import * as AuthSession from 'expo-auth-session';

export const name = 'AuthSession';

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
}
