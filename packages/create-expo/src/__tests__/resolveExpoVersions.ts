import nock from 'nock';

import { resolveExpoVersions } from '../resolveExpoVersions';

describe(resolveExpoVersions, () => {
  it('returns null when fetch throws', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network is down'));

    await expect(resolveExpoVersions()).resolves.toBe(null);
  });

  it('returns null when server failed', async () => {
    nock('https://api.expo.dev').get('/v2/versions').reply(500);

    await expect(resolveExpoVersions()).resolves.toBe(null);
  });

  it('returns version summary', async () => {
    nock('https://api.expo.dev')
      .get('/v2/versions')
      .reply(200, {
        expoGoSdkVersion: '57.0.0',
        sdkVersions: {
          '56.0.0': { releaseNoteUrl: 'https://example.com', isDeprecated: true },
          '57.0.0': { releaseNoteUrl: 'https://example.com' },
          '58.0.0': { releaseNoteUrl: 'https://example.com' },
          '59.0.0': {},
        },
      });

    await expect(resolveExpoVersions()).resolves.toEqual({
      latestVersion: 58,
      expoGoVersion: 57,
    });
  });
});
