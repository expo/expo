import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { updateDevelopmentSessionAsync } from '../updateDevelopmentSession';

describe(updateDevelopmentSessionAsync, () => {
  it('update development session', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-alive?deviceId=123')
      .reply(200, require('./fixtures/native-modules/44.0.0.json'));
    await updateDevelopmentSessionAsync({
      deviceIds: ['123'],
      exp: {
        name: 'Test',
        description: 'Test',
        slug: 'test',
        primaryColor: '#ffffff',
      },
      runtime: 'native',
      url: 'https://example.com',
    });

    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-alive?deviceId=123')
      .reply(500, 'something went wrong');
    await expect(
      updateDevelopmentSessionAsync({
        deviceIds: ['123'],
        exp: {
          name: 'Test',
          description: 'Test',
          slug: 'test',
          primaryColor: '#ffffff',
        },
        runtime: 'native',
        url: 'https://example.com',
      })
    ).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
