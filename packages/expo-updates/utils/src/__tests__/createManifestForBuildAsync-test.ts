import spawnAsync from '@expo/spawn-async';
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
  drawableFileTypes: new Set(['png']),
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

let cwd: string;
let projectRoot: string;
/**
 * A destination outside the project, so the `app.manifest` a call writes is not
 * itself an untracked file that makes the next call read the tree as dirty.
 */
let destinationDir: string;

/** Commit the project root, with an exact committer date, so `%ct` is deterministic. */
async function commitProjectAsync(
  committedAt: Date,
  authoredAt: Date = committedAt
): Promise<void> {
  const epochSeconds = (date: Date) => `@${Math.floor(date.getTime() / 1000)} +0000`;
  await spawnAsync('git', ['init', '--quiet'], { cwd: projectRoot });
  await spawnAsync(
    'git',
    [
      '-c',
      'user.email=test@example.com',
      '-c',
      'user.name=Test',
      'commit',
      '--allow-empty',
      '-m',
      'initial',
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        GIT_COMMITTER_DATE: epochSeconds(committedAt),
        GIT_AUTHOR_DATE: epochSeconds(authoredAt),
      },
    }
  );
}

beforeEach(() => {
  delete process.env.EXPO_UPDATES_COMMIT_TIME_OVERRIDE;
  cwd = process.cwd();
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-manifest-'));
  destinationDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-manifest-dest-'));
  jest.mocked(createMetroServerAndBundleRequestAsync).mockResolvedValue({
    server: { end: jest.fn() },
    bundleRequest: {},
  } as any);
  jest.mocked(exportEmbedAssetsAsync).mockResolvedValue([assetWithNonIosScales] as any);
});

afterEach(() => {
  delete process.env.EXPO_UPDATES_COMMIT_TIME_OVERRIDE;
  process.chdir(cwd);
  fs.rmSync(projectRoot, { recursive: true, force: true });
  fs.rmSync(destinationDir, { recursive: true, force: true });
});

async function createManifestAsync(platform: 'ios' | 'android', writeTo = projectRoot) {
  await createManifestForBuildAsync(platform, projectRoot, writeTo);
  return JSON.parse(fs.readFileSync(path.join(writeTo, 'app.manifest'), 'utf8'));
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
});

// `commitTime` decides which update launches, and a remote update's value is the
// moment it was published. Dating the embedded bundle to when the build ran lets
// a long build outrank an update published from a newer commit while it was
// running; that update is downloaded and then never launches.
describe('embedded commitTime', () => {
  const committedAt = new Date('2026-01-02T03:04:05.000Z');

  it('uses the committer date of the source commit', async () => {
    await commitProjectAsync(committedAt);
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBe(committedAt.getTime());
  });

  // The author date survives a rebase or cherry-pick from the original write, so
  // ordering by it would put a backport ahead of the work it already contains.
  it('uses the committer date rather than the author date', async () => {
    const authoredAt = new Date('2025-06-07T08:09:10.000Z');
    await commitProjectAsync(committedAt, authoredAt);
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBe(committedAt.getTime());
    expect(manifest.commitTime).not.toBe(authoredAt.getTime());
  });

  // A dirty tree's bundle corresponds to no commit, so dating it to one would
  // understate how new it is and let an older update win.
  it('falls back to the build time when the working tree is dirty', async () => {
    const before = Date.now();
    await commitProjectAsync(committedAt);
    fs.writeFileSync(path.join(projectRoot, 'uncommitted.js'), '// scratch');
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBeGreaterThanOrEqual(before);
  });

  it('falls back to the build time outside a git checkout', async () => {
    const before = Date.now();
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBeGreaterThanOrEqual(before);
  });

  // A commit dated in the future would outrank every update published after it,
  // which is the same failure with the sign flipped.
  it('clamps a future-dated commit to the build time', async () => {
    const before = Date.now();
    await commitProjectAsync(new Date(before + 7 * 24 * 60 * 60 * 1000));
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBeGreaterThanOrEqual(before);
    expect(manifest.commitTime).toBeLessThan(before + 60 * 1000);
  });

  it('prefers EXPO_UPDATES_COMMIT_TIME_OVERRIDE over the commit', async () => {
    process.env.EXPO_UPDATES_COMMIT_TIME_OVERRIDE = '1735689600000';
    await commitProjectAsync(committedAt);
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBe(1735689600000);
  });

  it('ignores an override that is not epoch milliseconds', async () => {
    process.env.EXPO_UPDATES_COMMIT_TIME_OVERRIDE = 'yesterday';
    await commitProjectAsync(committedAt);
    const manifest = await createManifestAsync('ios', destinationDir);
    expect(manifest.commitTime).toBe(committedAt.getTime());
  });

  // Two builds run out of order from an older and a newer commit must still be
  // ordered by their commits, which is the property the launcher relies on.
  it('orders two builds by commit rather than by build order', async () => {
    await commitProjectAsync(new Date('2026-01-02T10:00:00.000Z'));
    const laterCommitBuiltFirst = (await createManifestAsync('ios', destinationDir)).commitTime;

    fs.rmSync(path.join(projectRoot, '.git'), { recursive: true, force: true });
    await commitProjectAsync(new Date('2026-01-02T09:00:00.000Z'));
    const earlierCommitBuiltSecond = (await createManifestAsync('ios', destinationDir)).commitTime;

    expect(earlierCommitBuiltSecond).toBeLessThan(laterCommitBuiltFirst);
  });
});
