import spawnAsync, { type SpawnResult } from '@expo/spawn-async';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { downloadPackageAsync, getTemplateDistTag } from '../templateUtils';
import { env } from '../utils/env';
import { extractLocalTarball } from '../utils/tar';

jest.mock('@expo/spawn-async');
jest.mock('../utils/tar');
jest.mock('../utils/ora', () => ({
  newStep: (_title: string, action: any) => action({ succeed: jest.fn() }),
}));

const compatTable = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../expo-module-template/snippets/sdk-compat.json'),
    'utf8'
  )
);

describe(downloadPackageAsync, () => {
  let targetDir: string;
  let downloadedCompat: object | null;

  beforeEach(async () => {
    targetDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'download-template-test-'));
    downloadedCompat = null;
    jest.spyOn(env, 'EXPO_BETA', 'get').mockReturnValue(false);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.mocked(spawnAsync).mockReset();
    jest.mocked(spawnAsync).mockResolvedValue({
      stdout: JSON.stringify([{ filename: 'template.tgz' }]),
    } as SpawnResult);
    jest.mocked(extractLocalTarball).mockReset();
    jest.mocked(extractLocalTarball).mockImplementation(async ({ dir }) => {
      const snippetsDir = path.join(dir, 'package', 'snippets');
      await fs.promises.mkdir(snippetsDir, { recursive: true });
      if (downloadedCompat != null) {
        await fs.promises.writeFile(
          path.join(snippetsDir, 'sdk-compat.json'),
          JSON.stringify(downloadedCompat)
        );
      }
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.promises.rm(targetDir, { recursive: true, force: true });
  });

  it.each([
    ['missing compatibility file', null],
    ['missing SDK 55 entry', { '56': { modernExpoUI: true } }],
    ['empty SDK 55 entry', { '55': {} }],
  ])('rejects an SDK 55 fallback with %s before writing output', async (_label, table) => {
    downloadedCompat = table;
    jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('Versioned template unavailable'));

    await expect(downloadPackageAsync(targetDir, true, 55)).rejects.toThrow(
      'expo-module-template@latest template does not provide compatibility data for Expo SDK 55'
    );
    expect(jest.mocked(spawnAsync).mock.calls[1]![1]).toEqual([
      'pack',
      'expo-module-template@latest',
      '--json',
    ]);
    expect(await fs.promises.readdir(targetDir)).toEqual([]);
    const downloadDir = jest.mocked(spawnAsync).mock.calls[0]![2]!.cwd as string;
    expect(fs.existsSync(downloadDir)).toBe(false);
  });

  it('accepts a fallback that explicitly provides SDK 55 compatibility data', async () => {
    downloadedCompat = compatTable;
    jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('Versioned template unavailable'));

    const templatePath = await downloadPackageAsync(targetDir, true, 55);

    expect(templatePath).toBe(path.join(targetDir, 'package'));
    expect(fs.existsSync(path.join(templatePath, 'snippets', 'sdk-compat.json'))).toBe(true);
  });

  it('also rejects a versioned template without SDK 55 compatibility data', async () => {
    await expect(downloadPackageAsync(targetDir, true, 55)).rejects.toThrow('Expo SDK 55');
    expect(spawnAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(spawnAsync).mock.calls[0]![1]).toEqual([
      'pack',
      `expo-module-template@${getTemplateDistTag(require('../../package.json').version)}`,
      '--json',
    ]);
    expect(await fs.promises.readdir(targetDir)).toEqual([]);
  });

  it.each([
    ['SDK 56 local module', true, 56],
    ['standalone module', false, null],
  ] as const)('preserves the latest fallback for a %s', async (_label, isLocal, sdkVersion) => {
    jest.mocked(spawnAsync).mockRejectedValueOnce(new Error('Versioned template unavailable'));

    await expect(downloadPackageAsync(targetDir, isLocal, sdkVersion)).resolves.toBe(
      path.join(targetDir, 'package')
    );
  });
});
