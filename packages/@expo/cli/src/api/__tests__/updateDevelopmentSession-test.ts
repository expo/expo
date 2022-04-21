import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import {
  updateDevelopmentSessionAsync,
  closeDevelopmentSessionAsync,
} from '../updateDevelopmentSession';

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
      url: 'exp://192.168.1.69:19001',
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
        url: 'exp://192.168.1.69:19001',
      })
    ).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});

describe(closeDevelopmentSessionAsync, () => {
  it('close development session', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123')
      .reply(200, {
        data: {
          deleted: [
            {
              username: 'fiberjw',
              session: {
                description: 'Goodweebs on Juwans-MacBook-Pro.local',
                source: 'desktop',
                url: 'exp://192.168.1.69:19001',
              },
            },
          ],
        },
      });
    await closeDevelopmentSessionAsync({
      deviceIds: ['123'],
      url: 'exp://192.168.1.69:19001',
    });

    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123')
      .reply(500, 'something went wrong');
    await expect(
      closeDevelopmentSessionAsync({
        deviceIds: ['123'],
        url: 'exp://192.168.1.69:19001',
      })
    ).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
