import { vol } from 'memfs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { createFingerprintAsync } from '../../Fingerprint';
import type { HashSource, Options } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import { createFingerprintFromSourcesAsync } from '../../hash/Hash';
import { getPatchPackageSourcesAsync } from '../PatchPackage';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('resolve-from');
jest.mock('@expo/spawn-async');
jest.mock('../../ProjectWorkflow');
jest.mock('../../utils/SpawnIPC');

const workspaceRoot = path.resolve('/workspace');
const projectRoot = path.join(workspaceRoot, 'app');

function writeFixture(patchPath = 'patches/react-native@0.88.0.patch') {
  vol.fromJSON({
    [path.join(workspaceRoot, 'package.json')]: JSON.stringify({
      private: true,
      workspaces: ['app'],
      patchedDependencies: { 'react-native@0.88.0': patchPath },
    }),
    [path.join(projectRoot, 'package.json')]: JSON.stringify({
      name: 'app',
      dependencies: { 'react-native': '0.88.0' },
    }),
    [path.join(workspaceRoot, 'bun.lock')]: '{}',
    [path.join(workspaceRoot, patchPath)]: 'int revision = 1;\n',
  });
}

const packageSource: HashSource = {
  type: 'package',
  name: 'react-native',
  version: '0.88.0',
  filePath: '../node_modules/react-native/package.json',
  reasons: ['package:react-native'],
};

async function fingerprint(options?: Options, packageSources: HashSource[] = [packageSource]) {
  const normalized = await normalizeOptionsAsync(projectRoot, options);
  const sources = await getPatchPackageSourcesAsync(projectRoot, normalized, packageSources);
  return createFingerprintFromSourcesAsync(sources, projectRoot, normalized);
}

afterEach(() => {
  vol.reset();
});

describe('Bun workspace patch fingerprints', () => {
  it.each(['patches/react-native@0.88.0.patch', 'native-fixes/react-native.patch'])(
    'changes the hash when the declared workspace patch changes: %s',
    async (patchPath) => {
      writeFixture(patchPath);
      if (patchPath.startsWith('native-fixes/')) {
        vol.unlinkSync(path.join(workspaceRoot, 'bun.lock'));
        vol.writeFileSync(path.join(workspaceRoot, 'bun.lockb'), 'binary lock');
      }
      const before = await fingerprint();
      vol.writeFileSync(path.join(workspaceRoot, patchPath), 'int revision = 2;\n');
      const after = await fingerprint();

      expect(after.hash).not.toBe(before.hash);
      expect(after.sources.some((source) => source.hash != null)).toBe(true);
      for (const source of after.sources) {
        if ('filePath' in source) {
          expect(source.filePath).not.toContain('\\');
          expect(path.isAbsolute(source.filePath!)).toBe(false);
        }
      }
    }
  );

  it('includes workspace patches in the project fingerprint', async () => {
    writeFixture();
    const packageJson = path.join(workspaceRoot, 'node_modules/react-native/package.json');
    vol.fromJSON({ [packageJson]: JSON.stringify({ name: 'react-native', version: '0.88.0' }) });
    jest
      .mocked(resolveFrom.silent)
      .mockImplementation((_, id) =>
        id === 'react-native/package.json' ? packageJson : undefined
      );
    const before = await createFingerprintAsync(projectRoot);
    vol.writeFileSync(path.join(workspaceRoot, 'patches/react-native@0.88.0.patch'), 'revision 2');
    const after = await createFingerprintAsync(projectRoot);
    expect(after.hash).not.toBe(before.hash);
  });

  it('continues hashing app-local patch-package files', async () => {
    writeFixture();
    const localPatch = path.join(projectRoot, 'patches/local.patch');
    vol.mkdirSync(path.dirname(localPatch), { recursive: true });
    vol.writeFileSync(localPatch, 'local revision 1');
    const before = await fingerprint();
    vol.writeFileSync(localPatch, 'local revision 2');
    const after = await fingerprint();

    expect(after.hash).not.toBe(before.hash);
    expect(after.sources).toContainEqual(
      expect.objectContaining({ filePath: 'patches', type: 'dir' })
    );
  });

  it('does not hash an unreferenced workspace patch file', async () => {
    writeFixture();
    vol.fromJSON({ [path.join(projectRoot, 'patches/local.patch')]: 'local patch' });
    const unusedPatch = path.join(workspaceRoot, 'patches/unused.patch');
    vol.writeFileSync(unusedPatch, 'unused revision 1');
    const before = await fingerprint();
    vol.writeFileSync(unusedPatch, 'unused revision 2');
    const after = await fingerprint();

    expect(before.sources.some((source) => source.hash != null)).toBe(true);
    expect(after.hash).toBe(before.hash);
  });

  it('hashes patches for native directory sources, excluding other packages and versions', async () => {
    writeFixture('native-fixes/react-native.patch');
    vol.fromJSON({
      [path.join(workspaceRoot, 'node_modules/react-native/package.json')]: JSON.stringify({
        name: 'react-native',
        version: '0.88.0',
      }),
      [path.join(workspaceRoot, 'package.json')]: JSON.stringify({
        workspaces: ['app'],
        patchedDependencies: {
          'react-native@0.88.0': 'native-fixes/react-native.patch',
          'react-native@0.87.0': 'native-fixes/other-version.patch',
          'sibling-only@1.0.0': 'native-fixes/sibling.patch',
        },
      }),
      [path.join(workspaceRoot, 'native-fixes/other-version.patch')]: 'other version',
      [path.join(workspaceRoot, 'native-fixes/sibling.patch')]: 'sibling patch',
    });
    const sources: HashSource[] = [
      { type: 'dir', filePath: '../node_modules/react-native/React', reasons: ['autolinking'] },
    ];
    const before = await fingerprint(undefined, sources);
    vol.writeFileSync(path.join(workspaceRoot, 'native-fixes/react-native.patch'), 'revision 2');
    const after = await fingerprint(undefined, sources);
    expect(after.hash).not.toBe(before.hash);
    expect(
      (await fingerprint({ ignorePaths: ['../node_modules/react-native/React/'] }, sources)).sources
    ).toEqual([]);
    vol.writeFileSync(
      path.join(workspaceRoot, 'native-fixes/other-version.patch'),
      'other revision'
    );
    vol.writeFileSync(path.join(workspaceRoot, 'native-fixes/sibling.patch'), 'sibling revision');
    expect((await fingerprint(undefined, sources)).hash).toBe(after.hash);
  });

  it('keeps ignored app-local patch files out of the hash', async () => {
    writeFixture();
    vol.fromJSON({ [path.join(projectRoot, 'patches/local.patch')]: 'local revision 1' });
    const options = { ignorePaths: ['patches/'] };
    const before = await fingerprint(options);
    vol.writeFileSync(path.join(projectRoot, 'patches/local.patch'), 'local revision 2');
    const after = await fingerprint(options);

    expect(after.hash).toBe(before.hash);
    expect(after.sources).not.toContainEqual(expect.objectContaining({ filePath: 'patches' }));
  });

  it.each(['../patches/**', '**/patches/**', '../patches/'])(
    'does not bypass workspace patch ignores: %s',
    async (ignorePath) => {
      writeFixture();
      const options = { ignorePaths: [ignorePath] };
      const before = await fingerprint(options);
      vol.writeFileSync(
        path.join(workspaceRoot, 'patches/react-native@0.88.0.patch'),
        'int revision = 2;\n'
      );
      const after = await fingerprint(options);

      expect(after.hash).toBe(before.hash);
    }
  );
});
