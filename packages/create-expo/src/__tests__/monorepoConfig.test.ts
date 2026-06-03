import fs from 'fs';
import path from 'path';

import { loadMonorepoConfigAsync, MONOREPO_CONFIG_FILENAME } from '../monorepoConfig';

jest.mock('fs');

describe(loadMonorepoConfigAsync, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`parses ${MONOREPO_CONFIG_FILENAME} as JSON and returns the object`, async () => {
    const spyReadFile = jest.spyOn(fs.promises, 'readFile').mockImplementation(async (filePath) => {
      expect(path.basename(filePath as string)).toBe(MONOREPO_CONFIG_FILENAME);
      return JSON.stringify({
        renamePatterns: ['apps/*/app.json', 'apps/*/ios/Podfile'],
      });
    });

    const result = await loadMonorepoConfigAsync('/fake-project');
    expect(spyReadFile).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      renamePatterns: ['apps/*/app.json', 'apps/*/ios/Podfile'],
    });
  });

  it('returns undefined when the file is missing (ENOENT)', async () => {
    jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => {
      const error: any = new Error('not found');
      error.code = 'ENOENT';
      throw error;
    });

    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toBeUndefined();
  });

  it('returns undefined on other read errors (and does not throw)', async () => {
    jest.spyOn(fs.promises, 'readFile').mockImplementationOnce(async () => {
      const error: any = new Error('permission denied');
      error.code = 'EACCES';
      throw error;
    });

    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toBeUndefined();
  });

  it('returns undefined when the file contains invalid JSON', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('not { valid : json');

    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toBeUndefined();
  });

  it('returns undefined when the parsed value is not an object', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(JSON.stringify(['not', 'an object']));
    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toBeUndefined();

    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce(JSON.stringify('a string'));
    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toBeUndefined();
  });

  it('accepts an empty object (every field is optional)', async () => {
    jest.spyOn(fs.promises, 'readFile').mockResolvedValueOnce('{}');

    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toEqual({});
  });

  it('accepts a partial object (renamePatterns only)', async () => {
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValueOnce(JSON.stringify({ renamePatterns: ['apps/*/app.json'] }));

    await expect(loadMonorepoConfigAsync('/fake-project')).resolves.toEqual({
      renamePatterns: ['apps/*/app.json'],
    });
  });
});
