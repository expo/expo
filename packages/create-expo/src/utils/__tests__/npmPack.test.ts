import spawnAsync from '@expo/spawn-async';

import { npmPackAsync } from '../npm';

jest.mock('@expo/spawn-async');

const mockSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

function mockNpmStdout(stdout: string) {
  mockSpawnAsync.mockResolvedValue({ stdout } as any);
}

const packageInfo = {
  id: 'expo-template-blank@57.0.11',
  name: 'expo-template-blank',
  version: '57.0.11',
  size: 509443,
  unpackedSize: 516067,
  shasum: '5b4d5304d629b42cbbc35aeb59a8ac223412c1a1',
  integrity:
    'sha512-A9SuNKCRIkjKYaj39KG0h898wLXosWL2s/bF1AQLHhcJjDk+S7wTEpCXTjB59ocYRxhd4DRXEZ09Qq7VK99IQg==',
  filename: 'expo-template-blank-57.0.11.tgz',
  files: [],
  entryCount: 0,
  bundled: [],
};

describe(npmPackAsync, () => {
  afterEach(() => jest.clearAllMocks());

  it('parses the array response from npm@<12', async () => {
    mockNpmStdout(JSON.stringify([packageInfo]));
    await expect(npmPackAsync('expo-template-blank')).resolves.toEqual([packageInfo]);
  });

  it('parses the keyed object response from npm@>=12', async () => {
    mockNpmStdout(JSON.stringify({ 'expo-template-blank': packageInfo }));
    await expect(npmPackAsync('expo-template-blank')).resolves.toEqual([packageInfo]);
  });

  it('parses a single package info object', async () => {
    mockNpmStdout(JSON.stringify(packageInfo));
    await expect(npmPackAsync('expo-template-blank')).resolves.toEqual([packageInfo]);
  });

  it('ignores non-json noise surrounding the response', async () => {
    mockNpmStdout(`npm warn using --force\n${JSON.stringify([packageInfo])}\nnpm notice done`);
    await expect(npmPackAsync('expo-template-blank')).resolves.toEqual([packageInfo]);
  });

  it('returns null without output', async () => {
    mockNpmStdout('');
    await expect(npmPackAsync('expo-template-blank')).resolves.toBeNull();
  });

  it('throws on an unexpected response', async () => {
    mockNpmStdout('{"error":{"code":"E404"}}');
    await expect(npmPackAsync('expo-template-blank')).rejects.toThrow(/Invalid response from npm/);
  });
});
