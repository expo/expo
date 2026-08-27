import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { createFingerprintAsync } from '../Fingerprint';

// This is an integration test against a real project on disk, so opt out of the automatic
// `resolve-from` mock from `__mocks__/` and use the real module resolution.
jest.unmock('resolve-from');

jest.mock('../ExpoConfigLoader', () => ({
  // Mock the getExpoConfigLoaderPath to use the built version rather than the typescript version from src
  getExpoConfigLoaderPath: jest.fn(() =>
    jest.requireActual('path').resolve(__dirname, '..', '..', 'build', 'ExpoConfigLoader.js')
  ),
}));

// Path to the `expo` package inside this monorepo, symlinked into the temporary project so
// `expo/config` is resolvable from the project root.
const EXPO_PACKAGE_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'expo');

describe('createFingerprintAsync - projectRoot spelled through a symlink', () => {
  jest.setTimeout(120000);

  let tmpDir: string;
  let projectRoot: string;
  let symlinkedProjectRoot: string;
  let symlinkSupported = false;

  beforeAll(async () => {
    // Use the realpath so that symlinked temp dirs (e.g. /var -> /private/var on macOS)
    // don't hide or double up the behavior under test.
    tmpDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'fingerprint-symlink-'));
    projectRoot = path.join(tmpDir, 'project');
    symlinkedProjectRoot = path.join(tmpDir, 'project-link');

    await fs.mkdir(path.join(projectRoot, 'plugins'), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, 'package.json'),
      JSON.stringify({ name: 'symlink-app', version: '1.0.0', dependencies: { expo: '*' } })
    );
    await fs.writeFile(
      path.join(projectRoot, 'app.json'),
      JSON.stringify({
        expo: { name: 'symlink-app', slug: 'symlink-app', plugins: ['./plugins/withNoop.js'] },
      })
    );
    await fs.writeFile(
      path.join(projectRoot, 'plugins', 'withNoop.js'),
      'module.exports = (config) => config;\n'
    );
    await fs.mkdir(path.join(projectRoot, 'node_modules'), { recursive: true });

    try {
      await fs.symlink(EXPO_PACKAGE_ROOT, path.join(projectRoot, 'node_modules', 'expo'));
      await fs.symlink(projectRoot, symlinkedProjectRoot);
      symlinkSupported = true;
    } catch {
      // Symlink creation is unsupported on this platform (e.g. Windows without privileges).
      symlinkSupported = false;
    }
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('produces the same hash for the realpath and a symlinked spelling of the same project', async () => {
    if (!symlinkSupported) {
      console.warn('Skipping - cannot create symlinks on this platform.');
      return;
    }

    const realFingerprint = await createFingerprintAsync(projectRoot);
    // Guard that the out-of-process config loader actually ran and captured the local
    // config plugin - otherwise this test would pass vacuously.
    expect(
      realFingerprint.sources.some(
        (source) =>
          source.type === 'file' &&
          source.filePath === 'plugins/withNoop.js' &&
          source.reasons.includes('expoConfigPlugins')
      )
    ).toBe(true);

    const symlinkedFingerprint = await createFingerprintAsync(symlinkedProjectRoot);
    expect(symlinkedFingerprint.hash).toBe(realFingerprint.hash);
  });
});
