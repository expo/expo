const fs = require('fs');
const os = require('os');
const path = require('path');

const resolveExistingFile = require('../../src/preset/resolveExistingFile');

describe('resolveExistingFile', () => {
  let dir;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-expo-resolve-'));
    fs.writeFileSync(path.join(dir, 'NativeVideoModule.js'), '');
    fs.writeFileSync(path.join(dir, 'plain.js'), '');
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns the file name when it exists', () => {
    const existing = path.join(dir, 'plain.js');
    expect(resolveExistingFile(existing)).toBe(existing);
  });

  it('falls back to the compiled sibling of a source-mapped frame', () => {
    // Stack frames raised inside a published package point at the original
    // TypeScript path, which is never emitted next to the compiled output.
    // This is what makes `expo-video` fail to find its `mocks` directory.
    expect(resolveExistingFile(path.join(dir, 'NativeVideoModule.ts'))).toBe(
      path.join(dir, 'NativeVideoModule.js')
    );
  });

  it.each(['.tsx', '.mts', '.cts'])('handles the %s extension', (extension) => {
    expect(resolveExistingFile(path.join(dir, `NativeVideoModule${extension}`))).toBe(
      path.join(dir, 'NativeVideoModule.js')
    );
  });

  it('returns null when neither the frame nor a compiled sibling exists', () => {
    expect(resolveExistingFile(path.join(dir, 'missing.ts'))).toBeNull();
    expect(resolveExistingFile(path.join(dir, 'missing.js'))).toBeNull();
  });

  it('returns null for an empty frame', () => {
    expect(resolveExistingFile(undefined)).toBeNull();
  });
});
