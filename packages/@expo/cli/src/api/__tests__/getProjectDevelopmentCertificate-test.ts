import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getProjectDevelopmentCertificateAsync } from '../getProjectDevelopmentCertificate';

jest.mock('../user/actions', () => ({
  ensureLoggedInAsync: jest.fn(),
}));

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(getProjectDevelopmentCertificateAsync, () => {
  it('gets project development certificate', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/projects/4254c843-457a-4a6e-9b21-1506dc175ba4/development-certificates')
      .reply(200, 'hello');
    const cert = await getProjectDevelopmentCertificateAsync(
      '4254c843-457a-4a6e-9b21-1506dc175ba4',
      'csr'
    );
    expect(cert).toBe('hello');
    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/projects/123/development-certificates')
      .reply(500, 'something went wrong');
    await expect(getProjectDevelopmentCertificateAsync('123', 'csr')).rejects.toThrowError(
      /Expo server/
    );
    expect(scope.isDone()).toBe(true);
  });
});
