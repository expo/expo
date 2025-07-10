import { vol } from 'memfs';

import { normalizeOptionsAsync } from '../../Options';
import { getPatchPackageSourcesAsync } from '../PatchPackage';
import { getHashSourcesAsync } from '../Sourcer';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../ProjectWorkflow');
jest.mock('../../utils/SpawnIPC');
jest.mock('/app/package.json', () => ({}), { virtual: true });

describe(getPatchPackageSourcesAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should contain patch-packages `patches` dir', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.fromJSON(require('./fixtures/PatchPackage.json'));

    const sources = await getPatchPackageSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'dir',
        filePath: 'patches',
      })
    );
  });

  it('should NOT add patches dir if it is ignored from the root', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    vol.fromJSON(require('./fixtures/PatchPackage.json'));

    const options = await normalizeOptionsAsync('/app', { ignorePaths: ['patches/'] });
    const sources = await getPatchPackageSourcesAsync('/app', options);
    expect(sources).toEqual([]);
  });
});

describe('patch-package postinstall', () => {
  it('should contain `package.json` scripts block for lifecycle patches', async () => {
    vol.fromJSON(require('./fixtures/ExpoManaged47Project.json'));
    const scriptsBlock = {
      postinstall: 'npx patch-package',
    };
    jest.doMock(
      '/app/package.json',
      () => ({
        name: 'app',
        private: true,
        scripts: scriptsBlock,
      }),
      { virtual: true }
    );

    const sources = await getHashSourcesAsync('/app', await normalizeOptionsAsync('/app'));
    expect(sources).toContainEqual(
      expect.objectContaining({
        type: 'contents',
        id: 'packageJson:scripts',
        contents: JSON.stringify(scriptsBlock),
        reasons: ['packageJson:scripts'],
      })
    );
  });
});
