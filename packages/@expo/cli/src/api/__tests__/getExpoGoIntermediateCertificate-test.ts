import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getExpoGoIntermediateCertificateAsync } from '../getExpoGoIntermediateCertificate';

jest.mock('../user/actions', () => ({
  ensureLoggedInAsync: jest.fn(),
}));

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(getExpoGoIntermediateCertificateAsync, () => {
  it('gets project development certificate', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get(
        '/v2/projects/4254c843-457a-4a6e-9b21-1506dc175ba4/development-certificates/expo-go-intermediate-certificate'
      )
      .reply(200, 'hello');
    const cert = await getExpoGoIntermediateCertificateAsync(
      '4254c843-457a-4a6e-9b21-1506dc175ba4'
    );
    expect(cert).toBe('hello');
    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/projects/123/development-certificates/expo-go-intermediate-certificate')
      .reply(500, 'something went wrong');
    await expect(getExpoGoIntermediateCertificateAsync('123')).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
