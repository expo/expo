import fs from 'fs/promises';

import { normalizeOptionsAsync } from '../Options';

jest.mock('fs/promises');
// Mock cpus to return a single core for consistent snapshot testing
jest.mock('os', () => ({ cpus: jest.fn().mockReturnValue([0]) }));

describe(normalizeOptionsAsync, () => {
  it('should return the default options if no options are provided', async () => {
    const options = await normalizeOptionsAsync('/app');
    expect(options).toMatchSnapshot();
  });

  it('should respect fingerprint config', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        '/app/fingerprint.config.js',
        () => ({
          hashAlgorithm: 'sha256',
        }),
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);

      const { hashAlgorithm } = await normalizeOptionsAsync('/app');
      expect(hashAlgorithm).toBe('sha256');

      jest.dontMock('/app/fingerprint.config.js');
    });
  });

  it('should respect fingerprint config', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        '/app/fingerprint.config.js',
        () => ({
          hashAlgorithm: 'sha256',
        }),
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);

      const { hashAlgorithm } = await normalizeOptionsAsync('/app');
      expect(hashAlgorithm).toBe('sha256');

      jest.dontMock('/app/fingerprint.config.js');
    });
  });

  it('should respect explicit option from arguments than fingerprint config', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        '/app/fingerprint.config.js',
        () => ({
          hashAlgorithm: 'sha256',
        }),
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);

      const { hashAlgorithm } = await normalizeOptionsAsync('/app', { hashAlgorithm: 'md5' });
      expect(hashAlgorithm).toBe('md5');

      jest.dontMock('/app/fingerprint.config.js');
    });
  });
});
