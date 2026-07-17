import type { HashSourcePackage } from '../../Fingerprint.types';
import { normalizeOptionsAsync } from '../../Options';
import { createLimiter } from '../../utils/Concurrency';
import { createFingerprintSourceAsync } from '../Hash';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../ProjectWorkflow');

const baseSource: HashSourcePackage = {
  type: 'package',
  name: 'expo-camera',
  version: '1.0.0',
  filePath: 'node_modules/expo-camera/package.json',
  reasons: ['expoAutolinkingPackage'],
};

async function hashPackageAsync(source: HashSourcePackage, debug = false) {
  const options = await normalizeOptionsAsync('/app', debug ? { debug: true } : undefined);
  const limiter = createLimiter(options.concurrentIoLimit);
  return createFingerprintSourceAsync(source, limiter, '/app', options);
}

describe('package sources', () => {
  it('should hash a package from its name and version', async () => {
    const result = await hashPackageAsync(baseSource);

    expect(result.type).toBe('package');
    expect(result.hash).toBeTruthy();
  });

  it('should produce the same hash when only the resolved path changes', async () => {
    const before = (await hashPackageAsync(baseSource)).hash;
    const after = (
      await hashPackageAsync({
        ...baseSource,
        filePath: 'apps/mobile/node_modules/expo-camera/package.json',
      })
    ).hash;

    expect(after).toBe(before);
  });

  it('should produce a different hash when the version changes', async () => {
    const before = (await hashPackageAsync(baseSource)).hash;
    const after = (await hashPackageAsync({ ...baseSource, version: '1.1.0' })).hash;

    expect(after).not.toBe(before);
  });

  it('should return a null hash when the package is ignored', async () => {
    const options = await normalizeOptionsAsync('/app', {
      ignorePaths: ['node_modules/expo-camera/package.json'],
    });
    const limiter = createLimiter(options.concurrentIoLimit);

    const result = await createFingerprintSourceAsync(baseSource, limiter, '/app', options);

    expect(result.hash).toBeNull();
  });

  it('should expose name and version in debug info', async () => {
    const result = await hashPackageAsync({ ...baseSource, version: '2.3.4' }, true);

    expect(result.debugInfo).toEqual(
      expect.objectContaining({ name: 'expo-camera', version: '2.3.4' })
    );
  });
});
