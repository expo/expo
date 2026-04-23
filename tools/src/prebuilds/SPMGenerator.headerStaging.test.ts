import fs from 'fs-extra';
import { glob } from 'glob';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';

describe('SPMGenerator header staging — expo-modules-core', () => {
  it('does not stage @implementation-fragment headers into the public include dir', async () => {
    const repoRoot = getExpoRepositoryRootDir();
    const configPath = path.join(repoRoot, 'packages/expo-modules-core/spm.config.json');
    const config = await fs.readJson(configPath);

    const target = config.products[0].targets.find(
      (t: any) => t.name === 'ExpoModulesCore_ios_objc'
    );
    assert.ok(target, 'ExpoModulesCore_ios_objc target must exist in spm.config.json');
    assert.ok(target.headerPattern, 'ExpoModulesCore_ios_objc must declare a headerPattern');

    // Mirror SPMGenerator's header staging:
    //   1. Glob target.headerPattern with target.exclude.
    //   2. Skip any file also listed in target.fileMapping — those are placed elsewhere
    //      (e.g. next to the source files for local #include) and are NOT staged into
    //      the public include/ dir. See SPMGenerator.ts:141-143 and 187-191.
    const targetSourcePath = path.join(repoRoot, 'packages/expo-modules-core', target.path);
    const stagedIntoInclude = await glob(target.headerPattern, {
      cwd: targetSourcePath,
      ignore: target.exclude ?? [],
    });

    const fileMappings: { from: string; to: string; type: string }[] = target.fileMapping ?? [];
    const mappedPaths = new Set<string>();
    for (const mapping of fileMappings) {
      const matches = await glob(mapping.from, {
        cwd: targetSourcePath,
        ignore: target.exclude ?? [],
      });
      for (const m of matches) mappedPaths.add(m);
    }
    const effectivelyStagedIntoInclude = stagedIntoInclude.filter((p) => !mappedPaths.has(p));

    // SwiftUIVirtualViewSharedImpl+Private.h is a code fragment that is #include'd inside an
    // @implementation block in SwiftUIVirtualViewObjC.mm and SwiftUIVirtualViewObjCDev.mm.
    // Staging it as a public header causes SPM explicit-PCM generation to fail because clang
    // tries to parse it as a standalone module header (missing @implementation context,
    // unresolved `react::` names, etc). See commit a51bee30b71 (PR #44118).
    const fragmentMatches = effectivelyStagedIntoInclude.filter((p) =>
      p.endsWith('SwiftUIVirtualViewSharedImpl+Private.h')
    );
    assert.deepEqual(
      fragmentMatches,
      [],
      `Fragment header leaked into ExpoModulesCore_ios_objc public include dir: ${fragmentMatches.join(', ')}. ` +
        `Add it to the target's fileMapping (type: "source") so it is staged next to the .mm files instead.`
    );
  });
});
