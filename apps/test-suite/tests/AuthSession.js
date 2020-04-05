import * as AuthSession from 'expo-auth-session';

export const name = 'AuthSession';

export async function test({ describe, it, expect, jasmine }) {
  describe('OpenID Connect Auto Discovery', () => {
    const issuer = 'https://accounts.google.com';

    it('fetches a provider config', async () => {
      const config = await AuthSession.fetchProviderConfigAsync(issuer);
      expect(config.authorizationEndpoint).toEqual('https://accounts.google.com/o/oauth2/v2/auth');
      expect(config.tokenEndpoint).toEqual('https://oauth2.googleapis.com/token');
      expect(config.revocationEndpoint).toEqual('https://oauth2.googleapis.com/revoke');
      expect(config.userInfoEndpoint).toEqual('https://openidconnect.googleapis.com/v1/userinfo');
    });
  });
}
