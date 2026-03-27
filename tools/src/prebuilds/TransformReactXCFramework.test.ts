/**
 * Tests for isVFSGenerated — version-stamp validation for VFS overlay.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, beforeEach, afterEach } from 'node:test';

import { isVFSGenerated } from './TransformReactXCFramework';
import { VersionStamp } from './VersionStamp';

describe('isVFSGenerated', () => {
  let tmpDir: string;
  let outputPath: string;
  let rnSourcePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfs-test-'));
    outputPath = path.join(tmpDir, 'output');
    rnSourcePath = path.join(tmpDir, 'react-native');
    fs.mkdirSync(outputPath, { recursive: true });
    fs.mkdirSync(rnSourcePath, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns false when template does not exist', () => {
    assert.equal(isVFSGenerated(outputPath), false);
  });

  it('returns true when template exists and no source path provided', () => {
    fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), 'content');
    assert.equal(isVFSGenerated(outputPath), true);
  });

  it('returns false when template exists but no version stamp file', () => {
    fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), 'content');
    fs.writeFileSync(
      path.join(rnSourcePath, 'package.json'),
      JSON.stringify({ version: '0.77.0' })
    );
    assert.equal(isVFSGenerated(outputPath, rnSourcePath), false);
  });

  it('returns true when version stamp matches current RN version', () => {
    fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), 'content');
    VersionStamp.write(outputPath, { reactNativeVersion: '0.77.0' }, '.vfs-version-stamp');
    fs.writeFileSync(
      path.join(rnSourcePath, 'package.json'),
      JSON.stringify({ version: '0.77.0' })
    );
    assert.equal(isVFSGenerated(outputPath, rnSourcePath), true);
  });

  it('returns false when version stamp does not match current RN version', () => {
    fs.writeFileSync(path.join(outputPath, 'React-VFS-template.yaml'), 'content');
    VersionStamp.write(outputPath, { reactNativeVersion: '0.76.0' }, '.vfs-version-stamp');
    fs.writeFileSync(
      path.join(rnSourcePath, 'package.json'),
      JSON.stringify({ version: '0.77.0' })
    );
    assert.equal(isVFSGenerated(outputPath, rnSourcePath), false);
  });
});
