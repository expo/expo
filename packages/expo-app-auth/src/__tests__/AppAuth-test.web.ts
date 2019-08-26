import * as AppAuth from '../AppAuth';

const refreshToken = '<DEBUG_VALUE>';
const config: any = {
  issuer: 'https://accounts.google.com',
  scopes: ['profile'],
  redirectUrl: ':/oauthredirect',
};

describe('authAsync', () => {
  it(`unavailable on web`, async () => {
    await expect(AppAuth.authAsync(config)).rejects.toThrowErrorMatchingSnapshot();
  });
});
