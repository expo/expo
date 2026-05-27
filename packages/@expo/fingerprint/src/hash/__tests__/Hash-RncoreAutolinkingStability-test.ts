import { vol } from 'memfs';
import path from 'path';

import type { HashSource } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import { createFingerprintFromSourcesAsync } from '../Hash';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../ProjectWorkflow');

describe('react-native core autolinking hash stability', () => {
  const projectRoot = '/app';
  const depDir = 'node_modules/react-native-reanimated';

  const packageJsonSource: HashSource[] = [
    { type: 'file', filePath: `${depDir}/package.json`, reasons: ['rncoreAutolinking'] },
  ];

  function seedDependency(version: string) {
    vol.fromJSON(
      {
        [`${depDir}/package.json`]: JSON.stringify({
          name: 'react-native-reanimated',
          version,
        }),
        [`${depDir}/src/index.ts`]: 'export const reanimated = true;',
        [`${depDir}/RNReanimated.podspec`]: 'pristine podspec',
      },
      projectRoot
    );
  }

  // Mimics a dependency that recopies prebuilt binaries into its own directory on
  // install, the way @shopify/react-native-skia's postinstall does. The path is not
  // a tracked source file, is not in DEFAULT_IGNORE_PATHS, and its bytes can differ
  // between a developer machine and a CI worker.
  function recopyPrebuiltBinary(bytes: string) {
    vol.mkdirSync(path.join(projectRoot, depDir, 'libs/ios'), { recursive: true });
    vol.writeFileSync(path.join(projectRoot, depDir, 'libs/ios/libreanimated.a'), bytes);
  }

  async function hashSourcesAsync(sources: HashSource[]): Promise<string> {
    const { hash } = await createFingerprintFromSourcesAsync(
      sources,
      projectRoot,
      await normalizeOptionsAsync(projectRoot)
    );
    return hash;
  }

  afterEach(() => {
    vol.reset();
  });

  it('is stable when a dependency recopies prebuilt binaries into its own dir', async () => {
    seedDependency('1.0.0');
    recopyPrebuiltBinary('machine-a bytes');
    const before = await hashSourcesAsync(packageJsonSource);

    recopyPrebuiltBinary('machine-b bytes');
    const after = await hashSourcesAsync(packageJsonSource);

    expect(after).toBe(before);
  });

  it('detects a version bump in an autolinked dependency package.json', async () => {
    seedDependency('1.0.0');
    const before = await hashSourcesAsync(packageJsonSource);

    vol.reset();
    seedDependency('1.0.1');
    const after = await hashSourcesAsync(packageJsonSource);

    expect(after).not.toBe(before);
  });

  // Accepted tradeoff: hashing package.json instead of the whole dir no longer
  // catches an in-place native edit that does not bump the version. Version bumps
  // and the rncoreAutolinkingConfig source are the safety net for build-relevant
  // changes.
  it('does not detect an in-place native edit without a version bump', async () => {
    seedDependency('1.0.0');
    const before = await hashSourcesAsync(packageJsonSource);

    vol.writeFileSync(path.join(projectRoot, depDir, 'RNReanimated.podspec'), 'edited podspec');
    const after = await hashSourcesAsync(packageJsonSource);

    expect(after).toBe(before);
  });

  it('would drift on recopied binaries if the whole dir were hashed', async () => {
    const dirSources: HashSource[] = [
      { type: 'dir', filePath: depDir, reasons: ['rncoreAutolinking'] },
    ];

    seedDependency('1.0.0');
    recopyPrebuiltBinary('machine-a bytes');
    const before = await hashSourcesAsync(dirSources);

    recopyPrebuiltBinary('machine-b bytes');
    const after = await hashSourcesAsync(dirSources);

    expect(after).not.toBe(before);
  });
});
