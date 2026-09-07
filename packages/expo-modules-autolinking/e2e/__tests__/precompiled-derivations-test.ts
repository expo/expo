import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { join, resolve } from 'path';

import { autolinkingRunAsync } from '../TestUtils';

jest.unmock('fs');
jest.unmock('fs/promises');
jest.setTimeout(2 * 60 * 1000);

const repoRoot = resolve(__dirname, '../../../..');
const runnerPath = join(__dirname, '../../scripts/ios/dump_precompiled_derivations.rb');
const fixturePath = join(__dirname, '../__fixtures__/precompiled-derivations-bare-expo.json');
const bareExpoIosPath = join(repoRoot, 'apps/bare-expo/ios');

const regenCommand =
  'ruby packages/expo-modules-autolinking/scripts/ios/dump_precompiled_derivations.rb ' +
  'apps/bare-expo/ios packages/expo-modules-autolinking/e2e/__fixtures__/precompiled-derivations-bare-expo.json';

function rubyAvailable(): boolean {
  try {
    execFileSync('ruby', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// The dump resolves external packages through bare-expo's node_modules, so it
// only produces the fixture's content in a bootstrapped monorepo checkout.
const canRun = rubyAvailable() && fs.existsSync(join(repoRoot, 'apps/bare-expo/node_modules/expo'));

(canRun ? describe : describe.skip)('precompiled derivations dump', () => {
  it('matches the committed bare-expo fixture', () => {
    const outputPath = join(
      fs.mkdtempSync(join(fs.realpathSync(os.tmpdir()), 'derivations-dump-')),
      'dump.json'
    );
    try {
      execFileSync('ruby', [runnerPath, bareExpoIosPath, outputPath], { stdio: 'pipe' });
    } catch (error: any) {
      error.message = `${error.message}\n${error.stderr?.toString() ?? ''}`;
      throw error;
    }

    const actual = fs.readFileSync(outputPath, 'utf8');
    const expected = fs.readFileSync(fixturePath, 'utf8');
    try {
      expect(JSON.parse(actual)).toEqual(JSON.parse(expected));
      expect(actual).toBe(expected);
    } catch (error: any) {
      error.message =
        'The precompiled derivations no longer match the committed fixture. ' +
        '(The derivations are the per-pod data — npm/pod/product identity, dependency ' +
        'products, SPM packages, codegen names — that scripts/ios/precompiled_modules.rb ' +
        'computes from each spm.config.json during pod install; the fixture pins their ' +
        'current values while they migrate to autolinking metadata, see ENG-25370.)\n' +
        'If this change is intentional, regenerate the fixture and commit the result:\n\n' +
        `  ${regenCommand}\n\n${error.message}`;
      throw error;
    }
  });

  it('prebuilt-metadata emits the same identity fields as the fixture', async () => {
    const { stdout } = await autolinkingRunAsync(['prebuilt-metadata', '--json'], {
      cwd: bareExpoIosPath,
    });
    const pickIdentity = (entries: Record<string, any>, normalizePaths: boolean) =>
      Object.fromEntries(
        Object.entries(entries).map(([podName, e]) => [
          podName,
          {
            type: e.type,
            npmPackage: e.npmPackage,
            packageRoot: normalizePaths ? repoRelative(e.packageRoot) : e.packageRoot,
            podspecDir: normalizePaths ? repoRelative(e.podspecDir) : e.podspecDir,
            productName: e.productName,
          },
        ])
      );
    const actual = pickIdentity(JSON.parse(stdout), true);
    const expected = pickIdentity(JSON.parse(fs.readFileSync(fixturePath, 'utf8')), false);
    expect(actual).toEqual(expected);
  });
});

// Mirrors the Ruby dump's path canonicalization: repo-relative, pnpm store collapsed.
function repoRelative(p: string): string {
  return p
    .replace(`${fs.realpathSync(repoRoot)}/`, '')
    .replace(`${repoRoot}/`, '')
    .replace(/^node_modules\/\.pnpm\/[^/]+\/node_modules\//, 'node_modules/');
}
