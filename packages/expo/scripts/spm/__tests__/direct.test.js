'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { prepareDirectWatchPaths } = require('../direct');

describe('prepareDirectWatchPaths', () => {
  const savedBuildDir = process.env.BUILD_DIR;
  let outDir;
  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'direct-watch-'));
  });
  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
    if (savedBuildDir === undefined) {
      delete process.env.BUILD_DIR;
    } else {
      process.env.BUILD_DIR = savedBuildDir;
    }
  });

  // Clean Build Folder deletes the macro plugin link while RN's sync stamp survives.
  // A watched path that has vanished makes RN re-sync then.
  it('watches the macro plugin link when a direct module is emitted', () => {
    process.env.BUILD_DIR = '/tmp/Build/Products';
    expect(prepareDirectWatchPaths(['expo-haptics', 'expo-font'], outDir)).toEqual([
      path.join('/tmp/Build/Products', 'ExpoModulesMacros'),
    ]);
  });

  it('watches nothing when no direct module is emitted', () => {
    process.env.BUILD_DIR = '/tmp/Build/Products';
    expect(prepareDirectWatchPaths(['expo-font'], outDir)).toEqual([]);
    delete process.env.BUILD_DIR;
    expect(prepareDirectWatchPaths(['expo-font'], outDir)).toEqual([]);
  });

  // A command-line sync has no BUILD_DIR, so it cannot create the link, yet it writes a
  // fresh stamp. RN keeps only watched paths that exist and re-syncs when one is newer
  // than the stamp, so the marker must exist and stay newer than any later stamp.
  it('forces the next build to sync when sync runs outside a build', () => {
    delete process.env.BUILD_DIR;
    const watched = prepareDirectWatchPaths(['expo-haptics'], outDir);
    expect(watched).toHaveLength(1);
    expect(fs.existsSync(watched[0])).toBe(true);
    expect(fs.statSync(watched[0]).mtimeMs).toBeGreaterThan(Date.now() + 365 * 24 * 3600 * 1000);
  });

  it('removes the marker once no direct module is emitted', () => {
    delete process.env.BUILD_DIR;
    const [marker] = prepareDirectWatchPaths(['expo-haptics'], outDir);
    prepareDirectWatchPaths(['expo-font'], outDir);
    expect(fs.existsSync(marker)).toBe(false);
  });

  it('removes the marker once a sync runs inside a build', () => {
    delete process.env.BUILD_DIR;
    const [marker] = prepareDirectWatchPaths(['expo-haptics'], outDir);
    process.env.BUILD_DIR = '/tmp/Build/Products';
    prepareDirectWatchPaths(['expo-haptics'], outDir);
    expect(fs.existsSync(marker)).toBe(false);
  });
});
