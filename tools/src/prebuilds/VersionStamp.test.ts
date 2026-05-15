/**
 * Tests for VersionStamp — generic version-stamp utility for cache invalidation.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, beforeEach, afterEach } from 'node:test';

import { VersionStamp } from './VersionStamp';

describe('VersionStamp', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'version-stamp-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('write', () => {
    it('writes a stamp file with the given entries', () => {
      VersionStamp.write(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.84.1' });
      const stampPath = path.join(tmpDir, '.version-stamp');
      assert.ok(fs.existsSync(stampPath));
    });

    it('creates the directory if it does not exist', () => {
      const nested = path.join(tmpDir, 'a', 'b');
      VersionStamp.write(nested, { version: '1.0.0' });
      assert.ok(fs.existsSync(path.join(nested, '.version-stamp')));
    });
  });

  describe('isUpToDate', () => {
    it('returns false when no stamp file exists', () => {
      assert.equal(VersionStamp.isUpToDate(tmpDir, { version: '1.0.0' }), false);
    });

    it('returns true when all entries match', () => {
      VersionStamp.write(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.84.1' });
      assert.equal(
        VersionStamp.isUpToDate(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.84.1' }),
        true
      );
    });

    it('returns false when a value differs', () => {
      VersionStamp.write(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.84.1' });
      assert.equal(
        VersionStamp.isUpToDate(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.85.0' }),
        false
      );
    });

    it('returns false when a key is missing from stored stamp', () => {
      VersionStamp.write(tmpDir, { packageVersion: '1.2.3' });
      assert.equal(
        VersionStamp.isUpToDate(tmpDir, { packageVersion: '1.2.3', toolVersion: '0.84.1' }),
        false
      );
    });

    it('returns false when stored stamp has extra keys not in expected', () => {
      VersionStamp.write(tmpDir, { packageVersion: '1.2.3', extra: 'value' });
      assert.equal(VersionStamp.isUpToDate(tmpDir, { packageVersion: '1.2.3' }), false);
    });

    it('handles values with whitespace and special characters', () => {
      VersionStamp.write(tmpDir, { desc: 'hello world', path: '/foo/bar=baz' });
      assert.equal(
        VersionStamp.isUpToDate(tmpDir, { desc: 'hello world', path: '/foo/bar=baz' }),
        true
      );
    });
  });

  describe('read', () => {
    it('returns null when no stamp file exists', () => {
      assert.equal(VersionStamp.read(tmpDir), null);
    });

    it('returns the stored entries', () => {
      VersionStamp.write(tmpDir, { a: '1', b: '2' });
      assert.deepEqual(VersionStamp.read(tmpDir), { a: '1', b: '2' });
    });
  });

  describe('custom stamp filename', () => {
    it('supports a custom filename', () => {
      VersionStamp.write(tmpDir, { v: '1' }, '.my-stamp');
      assert.ok(fs.existsSync(path.join(tmpDir, '.my-stamp')));
      assert.equal(VersionStamp.isUpToDate(tmpDir, { v: '1' }, '.my-stamp'), true);
      assert.deepEqual(VersionStamp.read(tmpDir, '.my-stamp'), { v: '1' });
    });
  });
});
