import { mockProperty, unmockProperty } from 'jest-expo';

import ExpoAppAuth from '../ExpoAppAuth';
import * as AppAuth from '../AppAuth';

describe('AppAuth', () => {
  it(`authenticates correctly`, async () => {
    const config = {
      issuer: 'https://accounts.google.com',
      clientId: '<CLIENT_ID>',
      scopes: ['profile'],
      redirectUrl: ':/oauthredirect',
    };

    await AppAuth.authAsync(config);

    expect(ExpoAppAuth.executeAsync).toHaveBeenCalledWith(config);
  });
  it(`refreshes correctly`, async () => {
    const refreshToken = '<DEBUG_VALUE>';
    const config = {
      issuer: 'https://accounts.google.com',
      clientId: '<CLIENT_ID>',
      scopes: ['profile'],
      redirectUrl: ':/oauthredirect',
    };

    await AppAuth.refreshAsync(config, refreshToken);

    expect(ExpoAppAuth.executeAsync).toHaveBeenCalledWith({
      ...config,
      refreshToken,
      isRefresh: true,
    });
  });

  it(`rejects invalid IDs`, async () => {
    const refreshToken = '<DEBUG_VALUE>';
    const config: any = {
      issuer: 'https://accounts.google.com',
      scopes: ['profile'],
      redirectUrl: ':/oauthredirect',
    };

    expect(AppAuth.authAsync(config)).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
    expect(AppAuth.refreshAsync(config, refreshToken)).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
    expect(AppAuth.revokeAsync(config, {} as any)).rejects.toThrowError(
      'Config error: clientId must be a string'
    );
  });
});
