import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { findMissingBumps, parsePrecompiledPackages, packagesToBump } from './ChangesetCoverage';

function changesetsDir(files: Record<string, string>): string {
  const directory = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'abi-changesets-')),
    '.changeset'
  );
  fs.mkdirSync(directory);
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), contents);
  }
  return directory;
}

function changeset(releases: Record<string, string>): string {
  const header = Object.entries(releases)
    .map(([name, type]) => `"${name}": ${type}`)
    .join('\n');
  return `---\n${header}\n---\n\nBump precompiled artifacts\n`;
}

describe('findMissingBumps', () => {
  it('returns required packages no changeset bumps', async () => {
    const directory = changesetsDir({ 'one.md': changeset({ 'expo-font': 'patch' }) });
    assert.deepEqual(await findMissingBumps(directory, ['expo-font', 'expo-maps']), ['expo-maps']);
  });

  it('reads every changeset in the directory', async () => {
    const directory = changesetsDir({
      'one.md': changeset({ 'expo-font': 'patch' }),
      'two.md': changeset({ 'expo-maps': 'patch' }),
    });
    assert.deepEqual(await findMissingBumps(directory, ['expo-font', 'expo-maps']), []);
  });

  it('counts minor and major as covered', async () => {
    const directory = changesetsDir({
      'one.md': changeset({ 'expo-font': 'minor', 'expo-maps': 'major' }),
    });
    assert.deepEqual(await findMissingBumps(directory, ['expo-font', 'expo-maps']), []);
  });

  it('ignores README.md and config.json', async () => {
    const directory = changesetsDir({
      'README.md': '# Changesets\n',
      'config.json': '{}',
    });
    assert.deepEqual(await findMissingBumps(directory, ['expo-font']), ['expo-font']);
  });
});

describe('parsePrecompiledPackages', () => {
  it('reads the turbo query output after a warning banner, without core and JSI', () => {
    const stdout = [
      ' WARNING  something about {braces}',
      JSON.stringify({
        data: {
          packages: {
            items: [
              { name: 'expo-modules-jsi' },
              { name: 'expo-font' },
              { name: 'expo-modules-core' },
              { name: 'expo-camera' },
            ],
          },
        },
      }),
    ].join('\n');
    assert.deepEqual(parsePrecompiledPackages(stdout), ['expo-camera', 'expo-font']);
  });
});

describe('packagesToBump', () => {
  const removal = { section: 'Removed Decls', message: 'Func JSOptions.==(_:_:) has been removed' };
  const finalChange = {
    section: 'Decl Attribute changes',
    message: 'Var AppContext.runtime is now without final',
  };
  const all = ['expo-camera', 'expo-file-system', 'expo-font'];

  it('requires every precompiled package for a change that is not a removal', () => {
    assert.deepEqual(
      packagesToBump({
        abiFindings: [removal, finalChange],
        affected: [],
        symbolsComplete: true,
        all,
      }),
      all
    );
  });

  it('requires nothing for removals that no published module imports', () => {
    assert.deepEqual(
      packagesToBump({ abiFindings: [removal], affected: [], symbolsComplete: true, all }),
      []
    );
  });

  it('requires every precompiled package for removals when some modules were not checked', () => {
    assert.deepEqual(
      packagesToBump({ abiFindings: [removal], affected: [], symbolsComplete: false, all }),
      all
    );
  });

  it('requires only the affected packages when published modules import removed symbols', () => {
    assert.deepEqual(
      packagesToBump({
        abiFindings: [removal],
        affected: ['expo-font', 'expo-camera', 'expo-font'],
        symbolsComplete: true,
        all,
      }),
      ['expo-camera', 'expo-font']
    );
  });
});
