/**
 * Tests for SPMBuild helper functions:
 *  - derivePackageName
 *  - formatVersionRequirement
 *  - findFirstExisting
 *  - findXCFrameworkInDir
 */
import fs from 'fs-extra';
import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import os from 'os';
import path from 'path';

import {
  derivePackageName,
  formatVersionRequirement,
  findFirstExisting,
  findXCFrameworkInDir,
} from './SPMBuild';

// ---------------------------------------------------------------------------
// derivePackageName
// ---------------------------------------------------------------------------

describe('derivePackageName', () => {
  it('strips .git suffix and extracts last path segment', () => {
    assert.equal(
      derivePackageName('https://github.com/SDWebImage/SDWebImageWebPCoder.git'),
      'SDWebImageWebPCoder'
    );
  });

  it('works without .git suffix', () => {
    assert.equal(derivePackageName('https://github.com/airbnb/lottie-spm'), 'lottie-spm');
  });

  it('handles scoped / deeply nested URLs', () => {
    assert.equal(
      derivePackageName('https://github.com/nicklockwood/libavif-Xcode.git'),
      'libavif-Xcode'
    );
  });
});

// ---------------------------------------------------------------------------
// formatVersionRequirement
// ---------------------------------------------------------------------------

describe('formatVersionRequirement', () => {
  it('formats exact version', () => {
    assert.equal(formatVersionRequirement({ exact: '5.21.6' }), 'exact: "5.21.6"');
  });

  it('formats from version', () => {
    assert.equal(formatVersionRequirement({ from: '1.0.0' }), 'from: "1.0.0"');
  });

  it('formats branch version', () => {
    assert.equal(formatVersionRequirement({ branch: 'main' }), 'branch: "main"');
  });

  it('formats revision version', () => {
    assert.equal(formatVersionRequirement({ revision: 'abc123' }), 'revision: "abc123"');
  });

  it('throws for invalid version', () => {
    assert.throws(() => formatVersionRequirement({} as any), /Invalid SPM version/);
  });
});

// ---------------------------------------------------------------------------
// findFirstExisting  (uses real temp files)
// ---------------------------------------------------------------------------

describe('findFirstExisting', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-test-'));
    await fs.writeFile(path.join(tmpDir, 'a.txt'), '');
    await fs.writeFile(path.join(tmpDir, 'b.txt'), '');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('returns the first existing path', async () => {
    const result = await findFirstExisting([
      path.join(tmpDir, 'missing.txt'),
      path.join(tmpDir, 'a.txt'),
      path.join(tmpDir, 'b.txt'),
    ]);
    assert.equal(result, path.join(tmpDir, 'a.txt'));
  });

  it('returns null when none exist', async () => {
    const result = await findFirstExisting([
      path.join(tmpDir, 'x.txt'),
      path.join(tmpDir, 'y.txt'),
    ]);
    assert.equal(result, null);
  });

  it('returns null for empty array', async () => {
    assert.equal(await findFirstExisting([]), null);
  });
});

// ---------------------------------------------------------------------------
// findXCFrameworkInDir  (uses real temp directories)
// ---------------------------------------------------------------------------

describe('findXCFrameworkInDir', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-xcfw-test-'));
    // Simulate SPM artifacts layout:
    //   artifacts/lottie-spm/Lottie/Lottie.xcframework/Info.plist
    //   artifacts/other-pkg/Other/Other.xcframework/Info.plist
    const lottiePath = path.join(tmpDir, 'lottie-spm', 'Lottie', 'Lottie.xcframework');
    const otherPath = path.join(tmpDir, 'other-pkg', 'Other', 'Other.xcframework');
    await fs.mkdirp(lottiePath);
    await fs.writeFile(path.join(lottiePath, 'Info.plist'), '');
    await fs.mkdirp(otherPath);
    await fs.writeFile(path.join(otherPath, 'Info.plist'), '');
  });

  after(async () => {
    await fs.remove(tmpDir);
  });

  it('finds an xcframework nested in subdirectories', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'Lottie');
    assert.equal(result, path.join(tmpDir, 'lottie-spm', 'Lottie', 'Lottie.xcframework'));
  });

  it('finds a different xcframework', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'Other');
    assert.equal(result, path.join(tmpDir, 'other-pkg', 'Other', 'Other.xcframework'));
  });

  it('returns null when xcframework does not exist', async () => {
    const result = await findXCFrameworkInDir(tmpDir, 'NonExistent');
    assert.equal(result, null);
  });

  it('returns null for empty directory', async () => {
    const emptyDir = path.join(tmpDir, '_empty');
    await fs.mkdirp(emptyDir);
    const result = await findXCFrameworkInDir(emptyDir, 'Anything');
    assert.equal(result, null);
  });
});
