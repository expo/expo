import nock from 'nock';

import { asMock } from '../../__tests__/asMock';
import { getExpoApiBaseUrl } from '../endpoint';
import { signClassicExpoGoManifestAsync, signExpoGoManifestAsync } from '../signManifest';
import { ensureLoggedInAsync } from '../user/actions';

jest.mock('../user/actions', () => ({
  ensureLoggedInAsync: jest.fn(),
}));

beforeEach(() => {
  asMock(ensureLoggedInAsync).mockClear();
});

describe(signClassicExpoGoManifestAsync, () => {
  it('signs a manifest', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/manifest/sign')
      .reply(200, { data: { response: '...' } });
    await expect(signClassicExpoGoManifestAsync({} as any)).resolves.toBe('...');
    expect(ensureLoggedInAsync).toHaveBeenCalled();
    expect(scope.isDone()).toBe(true);
  });
});
describe(signExpoGoManifestAsync, () => {
  it('signs a manifest', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/manifest/eas/sign')
      .reply(200, { data: { signature: '...' } });

    await expect(signExpoGoManifestAsync({} as any)).resolves.toBe('...');
    expect(ensureLoggedInAsync).toHaveBeenCalled();
    expect(scope.isDone()).toBe(true);
  });
});
