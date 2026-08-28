// The one walk every project-local bin resolver shares (F113, wave 28). Each case below is a
// layout a package manager really produces, and the last two are the ones a literal
// `<projectRoot>/node_modules/.bin` path got wrong.
import { vol } from 'memfs';
import path from 'path';

import {
  describeProjectBinSearch,
  lookupProjectBin,
  projectBinFileName,
  resolveProjectBin,
} from '../projectBin';

const workspace = path.resolve('/workspace');
const projectRoot = path.join(workspace, 'apps', 'mobile');
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

beforeEach(() => {
  mockPlatform('darwin');
  vol.reset();
});

afterEach(() => {
  mockPlatform(realPlatform);
  vol.reset();
});

describe(resolveProjectBin, () => {
  it(`should find the bin the project installed itself`, () => {
    const bin = path.join(projectRoot, 'node_modules', '.bin', 'tsc');
    vol.fromJSON({ [bin]: '#!/bin/sh' });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBe(bin);
  });

  // F113: npm hoists a workspace so completely that `apps/mobile/node_modules` does not exist at
  // all, and every command that resolved a literal `<projectRoot>/node_modules/.bin` path reported
  // the tool as missing in a project where `npm install` had just succeeded.
  it(`should find a bin an npm workspace hoisted to the workspace root`, () => {
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'tsc');
    vol.fromJSON({
      [path.join(workspace, 'package.json')]: '{"workspaces":["apps/*"]}',
      [path.join(projectRoot, 'package.json')]: '{"name":"mobile"}',
      [hoisted]: '#!/bin/sh',
    });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBe(hoisted);
  });

  // The project's own copy is still the project's own copy: a walk that preferred an ancestor
  // would run a different version than the one this package pinned.
  it(`should prefer the nearest copy when both are installed`, () => {
    const own = path.join(projectRoot, 'node_modules', '.bin', 'tsc');
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'tsc');
    vol.fromJSON({ [own]: '#!/bin/sh', [hoisted]: '#!/bin/sh' });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBe(own);
  });

  it(`should answer null when no ancestor has it`, () => {
    vol.fromJSON({ [path.join(projectRoot, 'package.json')]: '{}' });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBeNull();
  });

  // A directory named like the bin is not the bin. `fileExistsSync` is what draws that line, and a
  // walk that accepted a directory would hand a spawn something it cannot execute.
  it(`should not accept a directory that shares the name`, () => {
    vol.fromJSON({
      [path.join(projectRoot, 'node_modules', '.bin', 'tsc', 'keep')]: '',
      [path.join(workspace, 'node_modules', '.bin', 'tsc')]: '#!/bin/sh',
    });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBe(
      path.join(workspace, 'node_modules', '.bin', 'tsc')
    );
  });

  it(`should look for the batch shim npm writes on Windows`, () => {
    mockPlatform('win32');
    const shim = path.join(workspace, 'node_modules', '.bin', 'tsc.cmd');
    vol.fromJSON({ [shim]: '@echo off' });

    expect(resolveProjectBin(projectRoot, 'tsc')).toBe(shim);
  });
});

describe(projectBinFileName, () => {
  it(`should name the shim on Windows and the file everywhere else`, () => {
    mockPlatform('win32');
    expect(projectBinFileName('expo')).toBe('expo.cmd');
    mockPlatform('linux');
    expect(projectBinFileName('expo')).toBe('expo');
  });
});

describe(lookupProjectBin, () => {
  // The stop rule, pinned: the filesystem root, which is where `resolvePackageRootSync` and
  // `detectPackageManager` stop too. Nothing here stops at the workspace root, because a workspace
  // root is not something a filesystem marks.
  it(`should search every ancestor up to the filesystem root`, () => {
    vol.fromJSON({ [path.join(projectRoot, 'package.json')]: '{}' });

    const lookup = lookupProjectBin(projectRoot, 'tsc');

    expect(lookup.command).toBeNull();
    expect(lookup.searched[0]).toBe(path.join(projectRoot, 'node_modules', '.bin'));
    expect(lookup.searched).toContain(path.join(workspace, 'node_modules', '.bin'));
    expect(lookup.searched[lookup.searched.length - 1]).toBe(
      path.join(path.parse(projectRoot).root, 'node_modules', '.bin')
    );
  });

  it(`should stop searching at the copy it found`, () => {
    const hoisted = path.join(workspace, 'node_modules', '.bin', 'tsc');
    vol.fromJSON({ [hoisted]: '#!/bin/sh' });

    const lookup = lookupProjectBin(projectRoot, 'tsc');

    expect(lookup.command).toBe(hoisted);
    expect(lookup.searched[lookup.searched.length - 1]).toBe(path.dirname(hoisted));
  });
});

describe(describeProjectBinSearch, () => {
  // The half of F113 that is not resolution: the advice. "install the project's dependencies" was
  // printed to a reader whose dependencies were installed and hoisted, so what the search actually
  // covered has to be in the sentence.
  it(`should name the directory it started at, the walk, and where it stopped`, () => {
    vol.fromJSON({ [path.join(projectRoot, 'package.json')]: '{}' });

    const described = describeProjectBinSearch('tsc', lookupProjectBin(projectRoot, 'tsc'));

    expect(described).toContain(path.join(projectRoot, 'node_modules', '.bin'));
    expect(described).toContain('every directory above it');
    expect(described).toContain(path.parse(projectRoot).root);
    expect(described).not.toContain('install');
  });
});
