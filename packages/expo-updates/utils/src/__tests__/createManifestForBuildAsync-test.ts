import {
  createMetroServerAndBundleRequestAsync,
  exportEmbedAssetsAsync,
} from 'expo/internal/unstable-expo-updates-cli-exports';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { createManifestForBuildAsync } from '../createManifestForBuildAsync';

jest.mock('expo/config/paths', () => ({
  resolveEntryPoint: () => 'index.js',
}));
jest.mock('expo/internal/unstable-expo-updates-cli-exports', () => ({
  createMetroServerAndBundleRequestAsync: jest.fn(),
  exportEmbedAssetsAsync: jest.fn(),
}));

// An asset shipping scale variants outside the set iOS allows, as `react-native-ui-lib` icons do.
const assetWithNonIosScales = {
  name: 'checkSmall',
  type: 'png',
  httpServerLocation: '/assets/icons',
  width: 16,
  height: 16,
  scales: [1, 1.5, 2, 3, 4],
  fileHashes: ['hash-1x', 'hash-1.5x', 'hash-2x', 'hash-3x', 'hash-4x'],
};

// An asset shipping both `name.png` and `name@1x.png`, as `@react-navigation/elements` icons do.
const assetWithDuplicateScales = {
  ...assetWithNonIosScales,
  name: 'clear-icon',
  scales: [1, 1, 2, 3, 4],
  fileHashes: ['hash-1x', 'hash-1x-duplicate', 'hash-2x', 'hash-3x', 'hash-4x'],
};

let cwd: string;
let projectRoot: string;

beforeEach(() => {
  cwd = process.cwd();
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-manifest-'));
  jest.mocked(createMetroServerAndBundleRequestAsync).mockResolvedValue({
    server: { end: jest.fn() },
    bundleRequest: {},
  } as any);
  jest.mocked(exportEmbedAssetsAsync).mockResolvedValue([assetWithNonIosScales] as any);
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

async function createManifestAsync(platform: 'ios' | 'android') {
  await createManifestForBuildAsync(platform, projectRoot, projectRoot);
  return JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.manifest'), 'utf8'));
}

describe(createManifestForBuildAsync, () => {
  it('assigns each iOS scale the hash of its own file when non-iOS scales are filtered out', async () => {
    const manifest = await createManifestAsync('ios');
    expect(manifest.assets.map((asset: any) => [asset.scale, asset.packagerHash])).toEqual([
      [1, 'hash-1x'],
      [2, 'hash-2x'],
      [3, 'hash-3x'],
    ]);
  });

  it('assigns each Android scale the hash of its own file', async () => {
    const manifest = await createManifestAsync('android');
    expect(manifest.assets.map((asset: any) => [asset.scale, asset.packagerHash])).toEqual([
      [1, 'hash-1x'],
      [1.5, 'hash-1.5x'],
      [2, 'hash-2x'],
      [3, 'hash-3x'],
      [4, 'hash-4x'],
    ]);
  });

  it('assigns each duplicate iOS scale the hash of its own file', async () => {
    jest.mocked(exportEmbedAssetsAsync).mockResolvedValue([assetWithDuplicateScales] as any);
    const manifest = await createManifestAsync('ios');
    expect(manifest.assets.map((asset: any) => [asset.scale, asset.packagerHash])).toEqual([
      [1, 'hash-1x'],
      [1, 'hash-1x-duplicate'],
      [2, 'hash-2x'],
      [3, 'hash-3x'],
    ]);
  });

  it('assigns each duplicate Android scale the hash of its own file', async () => {
    jest.mocked(exportEmbedAssetsAsync).mockResolvedValue([assetWithDuplicateScales] as any);
    const manifest = await createManifestAsync('android');
    expect(manifest.assets.map((asset: any) => [asset.scale, asset.packagerHash])).toEqual([
      [1, 'hash-1x'],
      [1, 'hash-1x-duplicate'],
      [2, 'hash-2x'],
      [3, 'hash-3x'],
      [4, 'hash-4x'],
    ]);
  });

  it('names Android resources the way React Native resolves them at runtime', async () => {
    jest.mocked(exportEmbedAssetsAsync).mockResolvedValue([
      {
        ...assetWithNonIosScales,
        httpServerLocation: '/assets?unstable_path=../../icons',
        scales: [1],
        fileHashes: ['hash-1x'],
      },
    ] as any);
    const manifest = await createManifestAsync('android');
    expect(manifest.assets).toEqual([
      expect.objectContaining({
        resourcesFilename: '_icons_checksmall',
        resourcesFolder: 'drawable',
      }),
    ]);
  });

  it('assigns the iOS fallback scale the hash of its own file', async () => {
    jest
      .mocked(exportEmbedAssetsAsync)
      .mockResolvedValue([
        { ...assetWithNonIosScales, scales: [1.5, 4], fileHashes: ['hash-1.5x', 'hash-4x'] },
      ] as any);
    const manifest = await createManifestAsync('ios');
    expect(manifest.assets.map((asset: any) => [asset.scale, asset.packagerHash])).toEqual([
      [4, 'hash-4x'],
    ]);
  });
});
