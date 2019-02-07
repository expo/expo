import * as AppAuth from '../AppAuth';
import ExpoAppAuth from '../ExpoAppAuth';

const refreshToken = '<DEBUG_VALUE>';
const config: any = {
  issuer: 'https://accounts.google.com',
  scopes: ['profile'],
  redirectUrl: ':/oauthredirect',
};

describe('authAsync', () => {
  it(`authenticates correctly`, async () => {
    const inputConfig = {
      ...config,
      clientId: '<CLIENT_ID>',
    };

    await AppAuth.authAsync(inputConfig);

    expect(ExpoAppAuth.executeAsync).toHaveBeenCalledWith(inputConfig);
  });

  it(`rejects invalid IDs`, async () => {
    await expect(AppAuth.authAsync(config)).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
  });
});

describe('refreshAsync', () => {
  it(`refreshes correctly`, async () => {
    const inputConfig = {
      ...config,
      clientId: '<CLIENT_ID>',
    };

    await AppAuth.refreshAsync(inputConfig, refreshToken);

    expect(ExpoAppAuth.executeAsync).toHaveBeenCalledWith({
      ...inputConfig,
      refreshToken,
      isRefresh: true,
    });
  });

  it(`rejects invalid IDs`, async () => {
    await expect(AppAuth.refreshAsync(config, refreshToken)).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
  });
});

describe('revokeAsync', () => {
  it(`rejects when a token isn't provided`, async () => {
    await expect(AppAuth.revokeAsync(config, {} as any)).rejects.toThrowError(
      'Please include the token to revoke'
    );
  });

  it(`rejects invalid IDs`, async () => {
    await expect(AppAuth.revokeAsync(config, { token: refreshToken })).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
  });
});
