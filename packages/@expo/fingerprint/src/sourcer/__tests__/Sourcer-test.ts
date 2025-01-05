import { vol } from 'memfs';

import { normalizeOptionsAsync } from '../../Options';
import { getHashSourcesAsync } from '../Sourcer';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../utils/SpawnIPC');

describe(getHashSourcesAsync, () => {
  it('should include `extraSources` from input parameter', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const sources = await getHashSourcesAsync(
      '/app',
      await normalizeOptionsAsync('/app', {
        extraSources: [{ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] }],
      })
    );
    expect(sources).toContainEqual({ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] });
  });
});
