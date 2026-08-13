import path from 'path';

import {
  findCentralDirectoryEntry,
  parseEndOfCentralDirectory,
  readLocalZipEntry,
  readZipEntry,
  EOCD_MAX_LENGTH,
  LOCAL_HEADER_MAX_LENGTH,
} from '../zipEntry';

// The zip fixtures live on the real filesystem; `fs` is globally mocked with memfs.
const realFs: typeof import('fs') = jest.requireActual('fs');

function loadFixture(name: string): Buffer {
  return realFs.readFileSync(path.join(__dirname, 'fixtures', 'zip', name));
}

describe(readZipEntry, () => {
  it.each([
    [
      'a deflated entry',
      'fixture-deflated.zip',
      'assets/app.fingerprint',
      'test-fingerprint-hash-'.repeat(50),
    ],
    ['a stored entry', 'fixture-stored.zip', 'assets/app.fingerprint', 'test-fingerprint-hash'],
    [
      'a later entry in the central directory',
      'fixture-stored.zip',
      'stored.txt',
      'stored content',
    ],
  ])(`reads %s`, (_description, fixture, entryName, expected) => {
    const contents = readZipEntry(loadFixture(fixture), entryName);
    expect(contents?.toString('utf8')).toBe(expected);
  });

  it(`returns null for a missing entry`, () => {
    const zip = loadFixture('fixture-stored.zip');
    expect(readZipEntry(zip, 'assets/missing')).toBeNull();
  });

  it(`throws on a buffer that is not a zip`, () => {
    expect(() => readZipEntry(Buffer.from('definitely not a zip archive'), 'x')).toThrow();
  });
});

describe('ranged reading', () => {
  it(`extracts an entry from partial buffers the way a ranged reader would`, () => {
    const zip = loadFixture('fixture-deflated.zip');

    // 1. Tail read: only the last bytes of the file.
    const tailLength = Math.min(zip.length, EOCD_MAX_LENGTH);
    const tail = zip.subarray(zip.length - tailLength);
    const directory = parseEndOfCentralDirectory(tail);

    // 2. Central directory read: exactly the directory's byte range.
    const centralDirectory = zip.subarray(directory.offset, directory.offset + directory.size);
    const location = findCentralDirectoryEntry(
      centralDirectory,
      directory.entryCount,
      'assets/app.fingerprint'
    );

    // 3. Entry read: a window from the local header.
    const windowLength = Math.min(
      LOCAL_HEADER_MAX_LENGTH + location!.compressedSize,
      zip.length - location!.localHeaderOffset
    );
    const local = zip.subarray(
      location!.localHeaderOffset,
      location!.localHeaderOffset + windowLength
    );
    const contents = readLocalZipEntry(local, location!);

    expect(contents.toString('utf8')).toBe('test-fingerprint-hash-'.repeat(50));
  });
});
