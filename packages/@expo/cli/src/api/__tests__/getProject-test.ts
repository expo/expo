import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getNativeModuleVersionsAsync } from '../getNativeModuleVersions';
import { getProjectAsync } from '../getProject';

jest.mock('../user/actions', () => ({
  ensureLoggedInAsync: jest.fn(),
}));

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(getNativeModuleVersionsAsync, () => {
  it('gets project', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/projects/4254c843-457a-4a6e-9b21-1506dc175ba4')
      .reply(200, require('./fixtures/projects/4254c843-457a-4a6e-9b21-1506dc175ba4.json'));
    const project = await getProjectAsync('4254c843-457a-4a6e-9b21-1506dc175ba4');

    expect(project.packageUsername).toBe('bacon');

    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/projects/123')
      .reply(500, 'something went wrong');
    await expect(getProjectAsync('123')).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
